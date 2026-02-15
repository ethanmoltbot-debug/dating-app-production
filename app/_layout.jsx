import { useAuth } from "@/utils/auth/useAuth";
import { Stack, Redirect, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { configurePurchasesOnce } from "@/utils/subscription";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import usePushNotifications from "@/hooks/usePushNotifications";
import { setCategoryEmojiMapFromList } from "@/utils/categoryEmojis";

// --- Mobile fetch base URL patch ---
// In native apps, `fetch('/api/...')` needs an absolute base URL.
// Anything provides EXPO_PUBLIC_BASE_URL (prod) and EXPO_PUBLIC_PROXY_BASE_URL (dev).
// If we don't prefix, requests can end up routed to a sandbox port that isn't open.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL || process.env.EXPO_PUBLIC_PROXY_BASE_URL;

if (
  Platform.OS !== "web" &&
  API_BASE_URL &&
  typeof API_BASE_URL === "string" &&
  API_BASE_URL.startsWith("http") &&
  !global.__WIFEY_FETCH_PATCHED__
) {
  try {
    const originalFetch = global.fetch;
    global.fetch = (input, init) => {
      try {
        if (typeof input === "string" && input.startsWith("/")) {
          const url = new URL(input, API_BASE_URL).toString();
          return originalFetch(url, init);
        }
      } catch (e) {
        console.error("[fetch patch] failed to build url", e);
      }
      return originalFetch(input, init);
    };

    global.__WIFEY_FETCH_PATCHED__ = true;
  } catch (e) {
    console.error("[fetch patch] failed to apply", e);
  }
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function isActiveCooldown(status, cooldownUntil) {
  if (status !== "COOLDOWN") return false;
  if (!cooldownUntil) return false;
  const d = new Date(cooldownUntil);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() < d.getTime();
}

function CategoryEmojiBootstrap() {
  const { data, error } = useQuery({
    queryKey: ["bootstrap", "categories"],
    queryFn: async () => {
      const resp = await fetch("/api/categories");
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/categories, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      return resp.json();
    },
    staleTime: 1000 * 60 * 5, // 5 min (lets admin changes show up quickly)
    retry: 1,
  });

  useEffect(() => {
    const list = Array.isArray(data?.categories) ? data.categories : null;
    if (list) {
      setCategoryEmojiMapFromList(list);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      // Best-effort only — defaults are fine.
      console.error(error);
    }
  }, [error]);

  return null;
}

export default function RootLayout() {
  const { initiate, isReady, auth, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [cooldownActive, setCooldownActive] = useState(false);
  const [verificationLocked, setVerificationLocked] = useState(false);
  const [lifetimeIneligible, setLifetimeIneligible] = useState(false);
  const [forceWelcome, setForceWelcome] = useState(false);

  usePushNotifications();

  useEffect(() => {
    initiate();
  }, [initiate]);

  // NEW: if the user authenticated via the web auth flow (useAuth / WebView),
  // ensure we also have (and cache) the matching row in the legacy `users` table.
  // This must run BEFORE the other guards (cooldown/verification) so we don't
  // accidentally run them with a stale userId.
  useEffect(() => {
    let cancelled = false;

    const ensureLegacyUser = async () => {
      try {
        if (!isReady) return;
        if (!isAuthenticated) return;

        const jwt = auth?.jwt;
        if (!jwt || typeof jwt !== "string") {
          // OTP-based auth uses AsyncStorage directly; nothing to do here.
          return;
        }

        const resp = await fetch("/api/users/ensure", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (!resp.ok) {
          console.error(
            `[AUTH][ENSURE_USER] /api/users/ensure failed: [${resp.status}] ${resp.statusText}`,
          );
          return;
        }

        const json = await resp.json().catch(() => null);
        const ensured = json?.user || null;
        const ensuredId = Number(ensured?.id);
        if (!Number.isFinite(ensuredId)) {
          return;
        }

        const existingRaw = await AsyncStorage.getItem("user");
        let existing = null;
        if (existingRaw) {
          try {
            existing = JSON.parse(existingRaw);
          } catch {
            existing = null;
          }
        }

        const merged = { ...(existing || {}), ...(ensured || {}) };

        if (!cancelled) {
          await AsyncStorage.setItem("user", JSON.stringify(merged));

          // IMPORTANT: if we configured RevenueCat before auth (common on cold start),
          // it may still be logged in as an old/stale app_user_id.
          // Kick the config helper again so it re-logs-in to the *ensured* legacy user id.
          if (Platform.OS !== "web") {
            configurePurchasesOnce();
          }
        }
      } catch (e) {
        console.error("[AUTH][ENSURE_USER] error", e);
      }
    };

    ensureLegacyUser();

    return () => {
      cancelled = true;
    };
  }, [auth?.jwt, isAuthenticated, isReady]);

  useEffect(() => {
    // Configure RevenueCat once for native apps.
    if (Platform.OS !== "web") {
      configurePurchasesOnce();
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  useEffect(() => {
    let cancelled = false;

    const checkCooldown = async () => {
      try {
        const userRaw = await AsyncStorage.getItem("user");
        if (!userRaw) {
          if (!cancelled) {
            setCooldownActive(false);
            setLifetimeIneligible(false);
            // IMPORTANT: don't clear forceWelcome here.
            // If another check (like profile lookup) detected a deleted user and set forceWelcome=true,
            // we want that redirect to win even after we clear AsyncStorage.
          }
          return;
        }

        const user = JSON.parse(userRaw);

        const response = await fetch(`/api/users/me?userId=${user.id}`);

        if (response.status === 404) {
          try {
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("onboarding_seen");
          } catch (e) {
            console.error(e);
          }
          if (!cancelled) {
            setCooldownActive(false);
            setLifetimeIneligible(false);
            setVerificationLocked(false);
            setForceWelcome(true);
          }
          return;
        }

        if (response.ok) {
          const json = await response.json();
          const merged = { ...(user || {}), ...(json?.user || {}) };
          await AsyncStorage.setItem("user", JSON.stringify(merged));
          if (!cancelled) {
            setCooldownActive(
              isActiveCooldown(merged.status, merged.cooldownUntil),
            );
            setLifetimeIneligible(merged.status === "LIFETIME_INELIGIBLE");
            setForceWelcome(false);
          }
          return;
        }

        if (!cancelled) {
          setCooldownActive(isActiveCooldown(user.status, user.cooldownUntil));
          setLifetimeIneligible(user.status === "LIFETIME_INELIGIBLE");
          setForceWelcome(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setCooldownActive(false);
          setLifetimeIneligible(false);
          // leave forceWelcome as-is
        }
      }
    };

    if (isReady) {
      checkCooldown();
    }

    return () => {
      cancelled = true;
    };
  }, [isReady, pathname]);

  useEffect(() => {
    let cancelled = false;

    const checkVerificationLock = async () => {
      try {
        const userRaw = await AsyncStorage.getItem("user");
        if (!userRaw) {
          if (!cancelled) setVerificationLocked(false);
          return;
        }

        const user = JSON.parse(userRaw);
        if (!user?.id) {
          if (!cancelled) setVerificationLocked(false);
          return;
        }

        // Only enforce lock once they're past auth/onboarding.
        const path = String(pathname || "");
        const isSafePath =
          path.startsWith("/auth/") ||
          path.startsWith("/onboarding") ||
          path.startsWith("/screening/gate") ||
          path.startsWith("/screening/reviewing") ||
          path.startsWith("/screening/cooldown") ||
          path.startsWith("/screening/outcome");

        if (isSafePath) {
          if (!cancelled) setVerificationLocked(false);
          return;
        }

        const resp = await fetch(`/api/profile/me?userId=${user.id}`);
        if (!resp.ok) {
          if (!cancelled) setVerificationLocked(false);
          return;
        }

        const json = await resp.json();
        const profile = json?.profile;

        if (!profile) {
          try {
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("onboarding_seen");
          } catch (e) {
            console.error(e);
          }
          if (!cancelled) {
            setVerificationLocked(false);
            setForceWelcome(true);
          }
          return;
        }

        const locked =
          profile.verification_status === "rejected" ||
          profile.is_verified !== true;

        if (!cancelled) {
          setVerificationLocked(!!locked);
          if (locked === false) setForceWelcome(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setVerificationLocked(false);
      }
    };

    if (isReady) {
      checkVerificationLock();
    }

    return () => {
      cancelled = true;
    };
  }, [isReady, pathname]);

  if (!isReady) {
    return null;
  }

  const pathStr = String(pathname || "");

  const shouldForceWelcome =
    forceWelcome &&
    !(pathStr.startsWith("/onboarding") || pathStr.startsWith("/auth/"));

  const shouldForceCooldown =
    cooldownActive && !pathStr.startsWith("/screening/cooldown");

  const shouldForceOutcome =
    lifetimeIneligible && !pathStr.startsWith("/screening/outcome");

  const shouldForceVerificationGate =
    verificationLocked &&
    !(
      pathStr.startsWith("/screening/gate") ||
      pathStr.startsWith("/screening/reviewing")
    );

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CategoryEmojiBootstrap />
        {shouldForceWelcome ? <Redirect href="/onboarding" /> : null}
        {shouldForceCooldown ? <Redirect href="/screening/cooldown" /> : null}
        {shouldForceOutcome ? (
          <Redirect href="/screening/outcome?result=LIFETIME_INELIGIBLE" />
        ) : null}
        {shouldForceVerificationGate ? (
          <Redirect href="/screening/gate" />
        ) : null}
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
