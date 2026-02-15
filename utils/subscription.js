import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { authKey } from "@/utils/auth/store";

let configured = false;
let configOk = false;
let configError = null;
let lastConfiguredApiKey = null; // NEW: lets us re-configure if env/key changes during dev

// NEW: pick the correct SDK key per platform + environment.
// NOTE: these must be EXPO_PUBLIC_* so they can be used in the Expo app.
function getRevenueCatSDKKey() {
  // IMPORTANT:
  // In Release builds (TestFlight/App Store), we want the App Store / Play Store keys.
  // In local dev, we want the RevenueCat Test Store.
  // Using a runtime dev flag is more reliable than EXPO_PUBLIC_CREATE_ENV.
  const isDevRuntime =
    typeof globalThis !== "undefined" && Boolean(globalThis.__DEV__);

  if (isDevRuntime) {
    return process.env.EXPO_PUBLIC_REVENUE_CAT_TEST_STORE_API_KEY;
  }

  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUE_CAT_APP_STORE_API_KEY;
  }

  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUE_CAT_PLAY_STORE_API_KEY;
  }

  // Just in case we ever land somewhere unexpected.
  return process.env.EXPO_PUBLIC_REVENUE_CAT_TEST_STORE_API_KEY;
}

export function configurePurchasesOnce() {
  // IMPORTANT: we may have configured Purchases before the user logged in.
  // In production we *always* want RevenueCat "app_user_id" to match our backend user id,
  // so on every call we do a best-effort logIn if we can.

  // NEW: compute the key even if we've already configured.
  // In dev, fast refresh can keep JS globals around, so we need to re-configure if the key changes.
  const apiKey = Platform.OS === "web" ? null : getRevenueCatSDKKey();

  if (configured) {
    if (configOk && Platform.OS !== "web") {
      // Re-configure if the API key changed (common when switching envs or restoring versions).
      if (apiKey && lastConfiguredApiKey && apiKey !== lastConfiguredApiKey) {
        try {
          Purchases.configure({ apiKey });
          lastConfiguredApiKey = apiKey;
        } catch (e) {
          console.warn("Failed to re-configure RevenueCat", e);
        }
      }

      getStoredUserId()
        .then((uid) => {
          if (!Number.isFinite(uid)) return;
          return Purchases.logIn(String(uid)).catch(() => null);
        })
        .catch(() => null);
    }

    return { ok: configOk, error: configError };
  }
  if (Platform.OS === "web") {
    configured = true;
    configOk = false;
    configError = "Subscriptions are not available on web.";
    return { ok: configOk, error: configError };
  }

  // IMPORTANT: do NOT use the server-side RevenueCat secret key in the mobile app.
  // The SDK needs the public (platform) API key.
  if (!apiKey) {
    configError =
      "Subscriptions are not configured. Missing RevenueCat SDK key (EXPO_PUBLIC_REVENUE_CAT_*).";
    console.warn(configError);
    configured = true;
    configOk = false;
    return { ok: configOk, error: configError };
  }

  try {
    const isDevRuntime =
      typeof globalThis !== "undefined" && Boolean(globalThis.__DEV__);
    if (isDevRuntime) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    // RevenueCat will handle iOS sandbox/prod automatically based on build.
    Purchases.configure({ apiKey });
    lastConfiguredApiKey = apiKey;

    // NEW: ensure RevenueCat "App User ID" matches our backend user id.
    // This is critical for production (webhooks + customer linking).
    // Best-effort (don't block the app if it fails).
    getStoredUserId()
      .then((uid) => {
        if (!Number.isFinite(uid)) return;
        return Purchases.logIn(String(uid)).catch(() => null);
      })
      .catch(() => null);

    configured = true;
    configOk = true;
    configError = null;
    return { ok: configOk, error: configError };
  } catch (e) {
    console.error("Failed to configure RevenueCat Purchases", e);
    configured = true;
    configOk = false;
    configError = "Failed to configure subscriptions.";
    return { ok: configOk, error: configError };
  }
}

function getActiveEntitlementKeys(customerInfo) {
  try {
    const active = customerInfo?.entitlements?.active;
    if (!active) return [];
    return Object.keys(active || {});
  } catch {
    return [];
  }
}

function getActiveSubscriptionProductIds(customerInfo) {
  try {
    const raw = customerInfo?.activeSubscriptions;
    const list = Array.isArray(raw) ? raw : [];
    return list
      .map((id) => String(id || "").trim())
      .filter((id) => id.length > 0);
  } catch {
    return [];
  }
}

function getSubscriptionTier(customerInfo) {
  // NOTE: We intentionally key off entitlement IDs.
  // Configure these in RevenueCat as entitlements named:
  // - "serious"
  // - "committed" (higher tier)
  const keys = getActiveEntitlementKeys(customerInfo).map((k) =>
    String(k || "").toLowerCase(),
  );

  // Be forgiving: allow entitlement identifiers like "wifey_committed".
  const hasCommittedEntitlement = keys.some((k) => k.includes("committed"));
  const hasSeriousEntitlement = keys.some((k) => k.includes("serious"));

  if (hasCommittedEntitlement) {
    return "committed";
  }

  if (hasSeriousEntitlement) {
    return "serious";
  }

  // Fallback: some RevenueCat setups don’t use entitlements for tiers.
  // In that case, infer tier from active subscription product identifiers.
  const activeProductIds = getActiveSubscriptionProductIds(customerInfo).map(
    (id) => id.toLowerCase(),
  );

  if (activeProductIds.some((id) => id.includes("committed"))) {
    return "committed";
  }
  if (activeProductIds.some((id) => id.includes("serious"))) {
    return "serious";
  }

  // Backwards-compatible fallback: any active entitlement counts as "pro".
  // This prevents the whole app from breaking if RevenueCat isn't set up yet.
  if (keys.length > 0) {
    return "serious";
  }

  // Final fallback: if there’s any active subscription but we can’t infer tier,
  // treat it as the *highest* tier so paying users don’t get stuck behind a lock.
  if (activeProductIds.length > 0) {
    return "committed";
  }

  return null;
}

async function getStoredUserId() {
  try {
    const raw = await AsyncStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      const id = Number(parsed?.id);
      if (Number.isFinite(id)) return id;
    }
  } catch {
    // ignore and fall through
  }

  // New auth uses SecureStore (see utils/auth). Use it to link RevenueCat user.
  try {
    const rawAuth = await SecureStore.getItemAsync(authKey);
    if (!rawAuth) return null;
    const parsed = JSON.parse(rawAuth);
    const id = Number(parsed?.user?.id);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

async function ensureRevenueCatLoggedIn() {
  try {
    const uid = await getStoredUserId();
    if (!Number.isFinite(uid)) return;
    // IMPORTANT: awaiting logIn avoids a race where getCustomerInfo()
    // returns the anonymous user (no entitlements) right after purchase.
    await Purchases.logIn(String(uid));
  } catch {
    // best-effort
  }
}

async function getAdminOverrideTier(userId) {
  try {
    if (!Number.isFinite(userId)) return null;

    const resp = await fetch(
      `/api/subscription/override?userId=${encodeURIComponent(String(userId))}`,
    );
    if (!resp.ok) {
      return null;
    }

    const json = await resp.json().catch(() => null);
    const tier = String(json?.override?.tier || "").toLowerCase();
    if (tier === "serious" || tier === "committed") {
      return tier;
    }

    return null;
  } catch {
    return null;
  }
}

export function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState(null); // null | "serious" | "committed"
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState(null);
  const [tierSource, setTierSource] = useState("none"); // none | revenuecat | admin_override

  const refresh = useCallback(async () => {
    if (Platform.OS === "web") {
      setTier(null);
      setTierSource("none");
      setIsAvailable(false);
      setError("Subscriptions are not available on web.");
      setLoading(false);
      return null;
    }

    try {
      // 1) Admin override (works even if RevenueCat isn't configured)
      const userId = await getStoredUserId();
      const overrideTier = await getAdminOverrideTier(userId);

      // 2) RevenueCat (normal)
      const { ok, error: configErr } = configurePurchasesOnce();
      setIsAvailable(ok);
      setError(configErr || null);

      let revenueCatTier = null;
      if (ok) {
        // Avoid race conditions: make sure we’re logged in before reading customer info.
        await ensureRevenueCatLoggedIn();
        const info = await Purchases.getCustomerInfo();
        revenueCatTier = getSubscriptionTier(info);
      }

      const finalTier = overrideTier || revenueCatTier;
      setTier(finalTier);
      setTierSource(
        overrideTier
          ? "admin_override"
          : revenueCatTier
            ? "revenuecat"
            : "none",
      );

      return finalTier;
    } catch (e) {
      console.error("Failed to fetch subscription status", e);
      setTier(null);
      setTierSource("none");
      setIsAvailable(false);
      setError("Could not check subscription status.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const presentPaywall = useCallback(async () => {
    if (Platform.OS === "web") {
      setIsAvailable(false);
      setError("Subscriptions are not available on web.");
      return false;
    }

    try {
      const { ok, error: configErr } = configurePurchasesOnce();
      setIsAvailable(ok);
      setError(configErr || null);

      if (!ok) {
        await refresh();
        return false;
      }

      const result = await RevenueCatUI.presentPaywall();
      const success =
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED;

      // always refresh after the paywall closes
      await refresh();

      return success;
    } catch (e) {
      console.error("Error presenting paywall", e);
      setError("Could not open subscription screen.");
      await refresh();
      return false;
    }
  }, [refresh]);

  const isPro = tier != null;
  const isSerious = tier === "serious" || tier === "committed";
  const isCommitted = tier === "committed";

  const isAdminOverride = tierSource === "admin_override";

  return {
    // Backwards compatible
    isPro,

    // New tier model
    tier,
    isSerious,
    isCommitted,

    // Debug / UX
    tierSource,
    isAdminOverride,

    loading,
    isAvailable,
    error,
    refresh,
    presentPaywall,
  };
}
