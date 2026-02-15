import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

function SoftBlobsBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -80,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: "rgba(255, 79, 216, 0.16)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 120,
          right: -110,
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: "rgba(124, 58, 237, 0.14)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -120,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: "rgba(99, 179, 237, 0.16)",
        }}
      />
    </View>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 420,
        alignSelf: "center",
        backgroundColor: "rgba(255,255,255,0.86)",
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
      }}
    >
      {children}
    </View>
  );
}

function StatusPill({ label, kind }) {
  const bg =
    kind === "granted"
      ? "rgba(16,185,129,0.14)"
      : kind === "denied"
        ? "rgba(239,68,68,0.12)"
        : "rgba(17,17,17,0.06)";

  const color =
    kind === "granted" ? "#047857" : kind === "denied" ? "#B91C1C" : "#6B7280";

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "900", color }}>{label}</Text>
    </View>
  );
}

const DONE_KEY = "wifey:onboarding_permissions:v2:notifications_done";

export default function OnboardingNotifications() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const BG_GRADIENT = useMemo(() => ["#F7EEFF", "#F2F7FF", "#FFF1F7"], []);
  const CTA_GRADIENT = useMemo(() => ["#FF4FD8", "#7C3AED"], []);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(null);
  const [notifStatus, setNotifStatus] = useState("unknown"); // unknown | undetermined | granted | denied

  const actionOpacity = busy ? 0.7 : 1;

  const loadUserId = useCallback(async () => {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.id ? Number(parsed.id) : null;
    } catch {
      return null;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        setNotifStatus("denied");
        return;
      }

      const perms = await Notifications.getPermissionsAsync();
      const status = perms?.status;

      if (status === "granted") {
        setNotifStatus("granted");
      } else if (status === "denied") {
        setNotifStatus("denied");
      } else {
        // iOS commonly returns "undetermined" before the first prompt
        setNotifStatus("undetermined");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const registerPushToken = useCallback(async (id) => {
    if (!Number.isFinite(id)) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      undefined;

    let tokenResp = null;
    try {
      tokenResp = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
    } catch (e) {
      console.error(
        "[PUSH][ONBOARDING] getExpoPushTokenAsync failed, retrying",
        e,
      );
      tokenResp = await Notifications.getExpoPushTokenAsync();
    }

    const token = tokenResp?.data || null;
    if (!token) {
      throw new Error("Could not get push token");
    }

    const resp = await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: id,
        expoPushToken: token,
        platform: Platform.OS,
      }),
    });

    if (!resp.ok) {
      throw new Error(
        `When registering /api/push/register, the response was [${resp.status}] ${resp.statusText}`,
      );
    }
  }, []);

  const requestNotifications = useCallback(async () => {
    if (busy) return;

    try {
      if (Platform.OS === "web") {
        Alert.alert("Notifications", "Notifications aren’t supported on web.");
        return;
      }

      setBusy(true);

      const current = await Notifications.getPermissionsAsync();
      const status = current?.status;

      // IMPORTANT: only show the system prompt when the user taps Allow.
      if (status === "undetermined") {
        const req = await Notifications.requestPermissionsAsync();
        const next = req?.status === "granted" ? "granted" : "denied";
        setNotifStatus(next);

        if (next === "granted" && Number.isFinite(userId)) {
          await registerPushToken(userId);
        }

        if (next !== "granted") {
          Alert.alert(
            "Notifications",
            "No problem — you can turn these on later in your phone settings.",
          );
        }

        return;
      }

      // If already granted, we don't re-prompt. Just (re)register the token.
      if (status === "granted") {
        setNotifStatus("granted");
        if (Number.isFinite(userId)) {
          await registerPushToken(userId);
        }
        return;
      }

      // If denied, iOS won't show the popup again — we need to send them to Settings.
      setNotifStatus("denied");
      Alert.alert(
        "Notifications",
        "Notifications are turned off for Wifey. You can enable them in Settings.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              try {
                Linking.openSettings();
              } catch (e) {
                console.error(e);
              }
            },
          },
        ],
      );
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Notifications",
        e?.message || "Could not enable notifications right now.",
      );
    } finally {
      setBusy(false);
    }
  }, [busy, registerPushToken, userId]);

  const goNext = useCallback(async () => {
    try {
      await AsyncStorage.setItem(DONE_KEY, "true");
    } catch (e) {
      console.error(e);
    }
    router.replace("/onboarding/location");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const id = await loadUserId();
        if (!cancelled) {
          setUserId(Number.isFinite(id) ? id : null);
        }

        // Only read status on load. Do NOT trigger native prompts here.
        await refreshStatus();

        // If already granted (from a prior run), make sure we still register a token.
        if (Platform.OS !== "web" && Number.isFinite(id)) {
          const perms = await Notifications.getPermissionsAsync();
          if (perms?.status === "granted") {
            await registerPushToken(Number(id));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [loadUserId, refreshStatus, registerPushToken]);

  const notifLabel =
    notifStatus === "granted"
      ? "Enabled"
      : notifStatus === "denied"
        ? "Not enabled"
        : "";

  const showPill = notifLabel.length > 0;

  const allowLabel =
    notifStatus === "denied"
      ? "Open Settings"
      : notifStatus === "granted"
        ? "Enabled"
        : "Allow";

  const allowDisabled = notifStatus === "granted" && busy;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: "900",
            color: "#111",
            textAlign: "center",
          }}
        >
          Notifications
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "#6B7280",
            textAlign: "center",
            fontWeight: "700",
            lineHeight: 20,
          }}
        >
          Get alerts for matches, messages, and updates.
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              Allow notifications
            </Text>
            {showPill ? (
              <StatusPill label={notifLabel} kind={notifStatus} />
            ) : null}
          </View>

          <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
            We’ll only send what matters: new matches, messages, and date
            updates.
          </Text>

          <TouchableOpacity
            onPress={requestNotifications}
            activeOpacity={0.9}
            disabled={busy || allowDisabled}
            style={{
              marginTop: 16,
              borderRadius: 16,
              overflow: "hidden",
              opacity: actionOpacity,
            }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
                {allowLabel}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Card>
      </View>

      <View style={{ padding: 24, paddingBottom: insets.bottom + 24 }}>
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.9}
          style={{
            width: "100%",
            maxWidth: 340,
            alignSelf: "center",
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.72)",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.10)",
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#111", fontSize: 17, fontWeight: "900" }}>
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.85}
          style={{ paddingTop: 10, alignItems: "center" }}
        >
          <Text style={{ color: "#6B7280", fontSize: 13, fontWeight: "800" }}>
            Not now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
