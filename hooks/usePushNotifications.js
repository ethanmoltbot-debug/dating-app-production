import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === "web") {
      return { token: null, error: null };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const perms = await Notifications.getPermissionsAsync();
    const status = perms?.status;

    // IMPORTANT: do not auto-trigger iOS/Android system prompts here.
    // Prompts should happen only when the user taps "Allow" on the onboarding/settings screens.
    if (status !== "granted") {
      return { token: null, error: "Permission not granted" };
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      undefined;

    // NOTE: In some standalone/TestFlight builds, projectId can be required.
    // We try with projectId when available, otherwise fall back to the no-args call.
    let tokenResp = null;
    try {
      tokenResp = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
    } catch (e) {
      console.error("[PUSH] getExpoPushTokenAsync failed, retrying", e);
      tokenResp = await Notifications.getExpoPushTokenAsync();
    }

    const token = tokenResp?.data || null;
    return { token, error: null };
  } catch (e) {
    console.error("[PUSH] registerForPushNotificationsAsync error", e);
    return { token: null, error: e?.message || String(e) };
  }
}

function getTargetPathFromNotificationData(data) {
  if (!data || typeof data !== "object") return null;

  const type = String(data.type || "").trim();
  const matchIdRaw = data.matchId;
  const matchId = matchIdRaw != null ? String(matchIdRaw) : "";

  // IMPORTANT: don’t include route-group segments like /(tabs) in hrefs.
  // expo-router resolves /home, /likes, /messages, etc. into the tabs layout automatically.

  if (type === "like") {
    return "/likes";
  }

  if (type === "feed_more" || type === "announcement") {
    return "/home";
  }

  if (type === "drink_ready" && matchId) {
    return `/messages/${matchId}?openDrink=1`;
  }

  if (
    (type === "chat_started" ||
      type === "date_invite" ||
      type === "date_update") &&
    matchId
  ) {
    return `/messages/${matchId}`;
  }

  if ((type === "match" || type === "message") && matchId) {
    return `/messages/${matchId}`;
  }

  return "/messages";
}

// NEW: immediate local notification helper (dev fallback when remote push is unavailable)
async function maybeScheduleLocalDrinkReady({ matchId }) {
  try {
    if (!matchId) return;
    if (Platform.OS === "web") return;

    const perms = await Notifications.getPermissionsAsync();
    const status = perms?.status;
    if (status !== "granted") {
      // Don't spam permission prompts here. Settings screen can request.
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Drink on Us",
        body: "Your drink is ready. Tap to unlock.",
        data: { type: "drink_ready", matchId: String(matchId) },
      },
      trigger: null,
    });
  } catch (e) {
    console.error("[LOCAL_NOTIF] Could not schedule drink-ready notif", e);
  }
}

export default function usePushNotifications() {
  const router = useRouter();
  const listenerRef = useRef(null);
  const responseRef = useRef(null);
  // NEW: interval ref for dev fallback polling
  const devPollRef = useRef(null);

  // IMPORTANT: the app can mount this hook before login finishes.
  // Also: users can sign out/sign back in during TestFlight QA.
  // We poll AsyncStorage so we always have the CURRENT legacy userId.
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadUserId = async () => {
      try {
        const userRaw = await AsyncStorage.getItem("user");
        if (!userRaw) {
          if (!cancelled) {
            setUserId((prev) => (prev === null ? prev : null));
          }
          return;
        }

        let parsed = null;
        try {
          parsed = JSON.parse(userRaw);
        } catch (e) {
          console.error("[PUSH] Invalid user JSON in storage", e);
          parsed = null;
        }

        const nextId = parsed?.id || null;
        if (!cancelled) {
          setUserId((prev) => {
            // Avoid re-render churn.
            if (prev === nextId) return prev;
            return nextId;
          });
        }
      } catch (e) {
        console.error("[PUSH] Could not read user from storage", e);
        if (!cancelled) {
          setUserId((prev) => (prev === null ? prev : null));
        }
      }
    };

    // Load once immediately, then keep in sync.
    loadUserId();
    const intervalId = setInterval(loadUserId, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const navigateFromResponse = (response) => {
      try {
        const data = response?.notification?.request?.content?.data;
        const target = getTargetPathFromNotificationData(data);
        if (!target) {
          return;
        }

        // Defer navigation slightly so router is fully mounted.
        setTimeout(() => {
          router.push(target);
        }, 0);
      } catch (e) {
        console.error("[PUSH] Could not navigate from push", e);
      }
    };

    const registerRemoteToken = async () => {
      try {
        if (!userId) return;

        const { token, error } = await registerForPushNotificationsAsync();
        if (!token || cancelled) {
          if (error) {
            console.warn("[PUSH] Not registering token:", error);
          }
          return;
        }

        // DEBUG: Log device token for local testing
        console.log("\n🔔 ===== DEVICE TOKEN (for APNs testing) =====");
        console.log(`Token: ${token}`);
        console.log("Copy this token and run: ./test-apns.sh <token>");
        console.log("==========================================\n");

        const resp = await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            expoPushToken: token,
            platform: Platform.OS,
          }),
        });

        if (!resp.ok) {
          console.error(
            `[PUSH] /api/push/register failed: [${resp.status}] ${resp.statusText}`,
          );
        }
      } catch (e) {
        console.error("[PUSH] Could not register push token", e);
      }
    };

    const startDevDrinkReadyPoll = async () => {
      try {
        if (!userId) return;

        // We only want this fallback in the Anything/Expo client.
        // In standalone builds, remote push should be wired correctly.
        const isStandalone = Constants?.appOwnership === "standalone";
        if (isStandalone) {
          return;
        }

        const tick = async () => {
          try {
            const resp = await fetch(
              `/api/drink-perk/ready?userId=${Number(userId)}`,
            );
            if (!resp.ok) {
              return;
            }
            const json = await resp.json();
            const ready = Array.isArray(json?.ready) ? json.ready : [];

            for (const item of ready) {
              const matchId = item?.matchId;
              const readyAt = item?.readyAt;
              if (!matchId || !readyAt) continue;

              const key = `drink_ready_notified_${String(matchId)}`;
              const last = await AsyncStorage.getItem(key);
              if (last && String(last) === String(readyAt)) {
                continue;
              }

              await AsyncStorage.setItem(key, String(readyAt));
              await maybeScheduleLocalDrinkReady({ matchId });
            }
          } catch (e) {
            console.error("[DEV_DRINK_READY_POLL] tick error", e);
          }
        };

        // fire once quickly then poll
        await tick();

        if (devPollRef.current) {
          clearInterval(devPollRef.current);
        }
        devPollRef.current = setInterval(() => {
          if (cancelled) return;
          tick();
        }, 5000);
      } catch (e) {
        console.error("[DEV_DRINK_READY_POLL] start error", e);
      }
    };

    // (Re)register and (re)start polling whenever we get a userId.
    registerRemoteToken();
    startDevDrinkReadyPoll();

    // Foreground listener (optional, but helpful for debug)
    listenerRef.current = Notifications.addNotificationReceivedListener(() => {
      // no-op
    });

    // If the app was opened from a killed state by tapping a push
    Notifications.getLastNotificationResponseAsync()
      .then((resp) => {
        if (resp && !cancelled) {
          navigateFromResponse(resp);
        }
      })
      .catch(() => {
        // ignore
      });

    // Tapping a notification (background/foreground)
    responseRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (cancelled) return;
        navigateFromResponse(response);
      },
    );

    return () => {
      cancelled = true;

      if (listenerRef.current) {
        try {
          Notifications.removeNotificationSubscription(listenerRef.current);
        } catch (e) {
          console.error("[PUSH] Error removing notification listener", e);
        }
        listenerRef.current = null;
      }
      if (responseRef.current) {
        try {
          Notifications.removeNotificationSubscription(responseRef.current);
        } catch (e) {
          console.error("[PUSH] Error removing response listener", e);
        }
        responseRef.current = null;
      }

      // NEW: stop dev poll
      if (devPollRef.current) {
        clearInterval(devPollRef.current);
        devPollRef.current = null;
      }
    };
  }, [router, userId]);
}
