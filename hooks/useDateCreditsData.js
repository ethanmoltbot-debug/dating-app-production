import { useState, useCallback, useEffect } from "react";
import {
  safeReadUserFromStorage,
  safeWriteUserToStorage,
} from "@/utils/dateCreditsHelpers";

export function useDateCreditsData(jwt) {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(3);
  const [balanceCents, setBalanceCents] = useState(0);

  const loadUser = useCallback(async () => {
    try {
      const u = await safeReadUserFromStorage();
      const id = Number(u?.id);
      return Number.isFinite(id) ? id : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, []);

  const refresh = useCallback(
    async (uid) => {
      // IMPORTANT:
      // Prefer an explicit legacy userId when we have one.
      // This prevents stale credit displays when token parsing fails in some RN runtimes.
      const idNum = Number(uid);
      const hasUid = Number.isFinite(idNum);

      const hasJwt = jwt && typeof jwt === "string";
      if (!hasUid && !hasJwt) return null;

      const url = hasUid
        ? `/api/date-credits/status?userId=${idNum}`
        : `/api/date-credits/status`;

      const resp = await fetch(url, {
        headers: hasJwt ? { Authorization: `Bearer ${jwt}` } : undefined,
      });
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/date-credits/status, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      const data = await resp.json();

      // NEW: if backend resolved a different legacy user id, adopt it so
      // everything (messages, matches, credits) stays consistent.
      const resolvedUserId = Number(data?.userId);
      if (Number.isFinite(resolvedUserId) && resolvedUserId !== Number(uid)) {
        setUserId(resolvedUserId);
        const existing = (await safeReadUserFromStorage()) || {};
        await safeWriteUserToStorage({ ...existing, id: resolvedUserId });
      }

      const nextCredits = Number(data?.credits || 0);
      const nextMaxCredits = Number(data?.maxCredits || 3);
      const nextBalanceCents = Number(data?.balanceCents || 0);

      setCredits(nextCredits);
      setMaxCredits(nextMaxCredits);
      setBalanceCents(nextBalanceCents);

      // NEW: return values so callers (like purchase polling) can act on fresh numbers
      return {
        credits: nextCredits,
        maxCredits: nextMaxCredits,
        balanceCents: nextBalanceCents,
      };
    },
    [jwt],
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const uid = await loadUser();
        if (!alive) return;
        setUserId(uid);
        // Even if uid is missing/stale, refresh() can resolve via jwt.
        await refresh(uid);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [loadUser, refresh]);

  return {
    userId,
    setUserId,
    loading,
    credits,
    setCredits,
    maxCredits,
    setMaxCredits,
    balanceCents,
    setBalanceCents,
    loadUser,
    refresh,
  };
}
