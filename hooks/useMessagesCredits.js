import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import Purchases from "react-native-purchases";
import { configurePurchasesOnce } from "@/utils/subscription";
import { extractLatestTransactionIdFromCustomerInfo } from "@/utils/dateCreditsHelpers";

export function useMessagesCredits({ jwt, user, loadMatches }) {
  const params = useLocalSearchParams();

  const creditsRefreshParam = useMemo(() => {
    const raw = params?.creditsRefresh;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const s = v != null ? String(v).trim() : "";
    return s || null;
  }, [params?.creditsRefresh]);

  const [creditStatus, setCreditStatus] = useState({
    credits: 0,
    maxCredits: 3,
  });

  const [restoreState, setRestoreState] = useState({
    restoring: false,
    lastError: null,
  });

  const refreshCredits = useCallback(
    async (userId) => {
      try {
        const uid = Number(userId);
        const hasUid = Number.isFinite(uid);
        const hasJwt = jwt && typeof jwt === "string";

        if (!hasUid && !hasJwt) {
          return null;
        }

        const url = hasUid
          ? `/api/date-credits/status?userId=${uid}`
          : "/api/date-credits/status";

        const resp = await fetch(url, {
          headers: hasJwt ? { Authorization: `Bearer ${jwt}` } : undefined,
        });

        if (!resp.ok) {
          throw new Error(
            `When fetching /api/date-credits/status, the response was [${resp.status}] ${resp.statusText}`,
          );
        }

        const data = await resp.json();
        const next = {
          credits: Number(data?.credits || 0),
          maxCredits: Number(data?.maxCredits || 3),
        };

        setCreditStatus(next);
        return next;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    [jwt],
  );

  const restoreInFlightRef = useRef(false);
  const attemptRestoreCredits = useCallback(
    async (userId) => {
      const hasJwt = jwt && typeof jwt === "string";
      const uid = Number(userId);
      if (!Number.isFinite(uid)) return null;
      if (!hasJwt) return null;

      // Avoid spamming RevenueCat / server
      if (restoreInFlightRef.current) return null;
      restoreInFlightRef.current = true;
      setRestoreState({ restoring: true, lastError: null });

      try {
        const { ok } = configurePurchasesOnce();
        if (!ok) {
          return null;
        }

        // Make sure RevenueCat is logged in as this user before syncing.
        await Purchases.logIn(String(uid)).catch(() => null);

        // Ensure RC receipt is synced (helps TestFlight)
        if (typeof Purchases.syncPurchases === "function") {
          await Purchases.syncPurchases().catch(() => null);
        }

        const info = await Purchases.getCustomerInfo().catch(() => null);
        const latestTxn = extractLatestTransactionIdFromCustomerInfo(info);

        if (!latestTxn?.transactionId || !latestTxn?.productId) {
          return null;
        }

        // Claim on the backend (idempotent by transaction id)
        const resp = await fetch("/api/date-credits/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            transactionId: latestTxn.transactionId,
            productId: latestTxn.productId,
          }),
        });

        const json = await resp.json().catch(() => null);
        if (!resp.ok) {
          throw new Error(json?.error || `Claim failed (${resp.status})`);
        }

        // Refresh credits after claim
        const next = await refreshCredits(uid);

        // Also refresh matches so the newly-unlocked section populates immediately
        if (next?.credits > 0) {
          loadMatches(uid).catch(() => null);
        }

        return next;
      } catch (e) {
        console.error(e);
        setRestoreState({
          restoring: false,
          lastError: e?.message || "Failed",
        });
        return null;
      } finally {
        setRestoreState((s) => ({ ...s, restoring: false }));
        restoreInFlightRef.current = false;
      }
    },
    [jwt, loadMatches, refreshCredits],
  );

  const lastCreditsRefreshRef = useRef(null);
  useEffect(() => {
    if (!creditsRefreshParam) return;
    if (!user?.id) return;

    if (lastCreditsRefreshRef.current === creditsRefreshParam) {
      return;
    }

    lastCreditsRefreshRef.current = creditsRefreshParam;

    loadMatches(user.id).catch(() => null);
    refreshCredits(user.id).catch(() => null);

    // NEW: also attempt to restore any just-finished purchase
    attemptRestoreCredits(user.id).catch(() => null);
  }, [
    attemptRestoreCredits,
    creditsRefreshParam,
    loadMatches,
    refreshCredits,
    user?.id,
  ]);

  return {
    creditStatus,
    refreshCredits,
    attemptRestoreCredits,
    restoreState,
  };
}
