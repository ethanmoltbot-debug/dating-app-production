import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import Purchases from "react-native-purchases";
import {
  safeReadUserFromStorage,
  safeWriteUserToStorage,
} from "@/utils/dateCreditsHelpers";

export function useDateCreditsActions({
  userId,
  setUserId,
  jwt,
  tier,
  matchIdParam,
  returnToParam,
  router,
  refresh,
  credits,
  setCredits,
  maxCredits,
  setMaxCredits,
  balanceCents,
  setBalanceCents,
  isDevRuntime,
}) {
  const stockedUp = useMemo(() => {
    const c = Number(credits || 0);
    const m = Number(maxCredits || 0);
    if (!Number.isFinite(c) || !Number.isFinite(m)) return false;
    if (m <= 0) return false;
    return c >= m;
  }, [credits, maxCredits]);

  const goBack = useCallback(
    (opts = {}) => {
      let next = returnToParam;

      const purchaseStateRaw = opts?.purchaseState;
      const purchaseState =
        purchaseStateRaw != null ? String(purchaseStateRaw).trim() : "";

      // Add a nonce so the Messages screen can reliably refresh credits/matches
      const refreshNonce = String(Date.now());

      const appendParam = (url, key, value) => {
        const joiner = url.includes("?") ? "&" : "?";
        return `${url}${joiner}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      };

      next = appendParam(next, "creditsRefresh", refreshNonce);

      if (purchaseState) {
        next = appendParam(next, "purchaseState", purchaseState);
      }

      if (matchIdParam) {
        const isMessagesList =
          String(returnToParam || "").split("?")[0] === "/messages";
        if (isMessagesList) {
          next = appendParam(next, "matchId", matchIdParam);
        }
      }

      router.replace(next);
    },
    [matchIdParam, returnToParam, router],
  );

  // NEW: link the RevenueCat app user id (often $RCAnonymousID:...) to our numeric user id.
  // This makes the webhook able to credit the right wallet reliably.
  const linkRevenueCatToUser = useCallback(
    async (uid) => {
      const idNum = Number(uid);
      const hasJwt = jwt && typeof jwt === "string";
      if (!Number.isFinite(idNum) && !hasJwt) return;

      try {
        const info = await Purchases.getCustomerInfo();
        const candidates = [
          info?.appUserID,
          info?.appUserId,
          info?.originalAppUserId,
          info?.originalAppUserID,
        ]
          .map((v) => (v != null ? String(v).trim() : ""))
          .filter(Boolean);

        // De-dupe
        const uniq = Array.from(new Set(candidates));
        if (!uniq.length) return;

        const headers = { "Content-Type": "application/json" };
        if (hasJwt) {
          headers.Authorization = `Bearer ${jwt}`;
        }

        // v2 API: can link multiple app user ids in one request.
        await fetch("/api/revenuecat/link", {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: Number.isFinite(idNum) ? idNum : undefined,
            appUserIds: uniq,
          }),
        }).catch(() => null);
      } catch (e) {
        // Not fatal — purchases can still work; this just improves webhook mapping.
        console.error(e);
      }
    },
    [jwt],
  );

  const devGrantOneCredit = useCallback(async () => {
    if (!isDevRuntime) {
      Alert.alert("Not available", "This is only available in development.");
      return { ok: false, skipped: true };
    }

    if (!userId) {
      Alert.alert("Sign in", "Please sign in again.");
      return { ok: false, error: "Missing userId" };
    }

    try {
      const resp = await fetch("/api/dev/date-credits/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), amountCents: 3000 }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `Dev grant failed: [${resp.status}] ${resp.statusText} ${text}`,
        );
      }

      await refresh(userId);
      return { ok: true };
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add a dev credit.");
      return { ok: false, error: e?.message || "Dev grant failed" };
    }
  }, [isDevRuntime, refresh, userId]);

  const claimCreditFromClient = useCallback(
    async ({ transactionId, productId }) => {
      // IMPORTANT:
      // We require *some* auth token here so the backend can map the claim to a user.
      // This can be either:
      // - Web auth JWT (NextAuth) OR
      // - OTP apiJwt (issued by /api/auth/otp/verify)
      if (!jwt || typeof jwt !== "string") {
        return { ok: false, skipped: true };
      }

      const resp = await fetch("/api/date-credits/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ transactionId, productId }),
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(json?.error || `Claim failed (${resp.status})`);
      }

      // If claim ensured a new legacy user id, adopt it.
      const resolvedUserId = Number(json?.userId);
      if (Number.isFinite(resolvedUserId)) {
        setUserId(resolvedUserId);
        const existing = (await safeReadUserFromStorage()) || {};
        await safeWriteUserToStorage({ ...existing, id: resolvedUserId });
      }

      // NEW: apply returned wallet status immediately so the UI can unblock
      // even if the next status poll is slow.
      const nextCredits = Number(json?.credits);
      const nextMaxCredits = Number(json?.maxCredits);
      const nextBalance = Number(json?.balanceCents);
      if (Number.isFinite(nextCredits)) setCredits(nextCredits);
      if (Number.isFinite(nextMaxCredits)) setMaxCredits(nextMaxCredits);
      if (Number.isFinite(nextBalance)) setBalanceCents(nextBalance);

      return { ok: true, response: json };
    },
    [jwt, setUserId, setCredits, setMaxCredits, setBalanceCents],
  );

  return {
    stockedUp,
    goBack,
    linkRevenueCatToUser,
    devGrantOneCredit,
    claimCreditFromClient,
  };
}
