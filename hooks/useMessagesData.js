import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";

export function useMessagesData({ jwt } = {}) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [pendingMatchCount, setPendingMatchCount] = useState(0);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  // NEW: safety valve so the Messages tab can never spin forever.
  const didFinishInitialLoadRef = useRef(false);

  // NEW: when we have a web-auth JWT (mobile WebView auth), make sure we are
  // using the correct legacy `users.id`.
  const ensureLegacyUserFromJwt = useCallback(async () => {
    const token = jwt && typeof jwt === "string" ? jwt : null;
    if (!token) return null;

    try {
      const resp = await fetch("/api/users/ensure", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        // Non-fatal: fall back to AsyncStorage.
        return null;
      }

      const data = await resp.json().catch(() => null);
      const ensured = data?.user || null;

      const ensuredId = Number(ensured?.id);
      if (!Number.isFinite(ensuredId)) {
        return null;
      }

      return ensured;
    } catch (e) {
      console.error("/api/users/ensure failed", e);
      return null;
    }
  }, [jwt]);

  const markMatchesSeen = useCallback(
    async (userId) => {
      try {
        const resp = await fetch("/api/matches/mark-seen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (resp.ok) {
          queryClient.invalidateQueries({
            queryKey: ["matchesForBadge", userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["matchesSummary", userId],
          });
        }
      } catch (e) {
        console.error("Could not mark matches seen", e);
      }
    },
    [queryClient],
  );

  const fetchWithTimeout = useCallback(async (url, options, timeoutMs) => {
    // NOTE: AbortController support varies across RN runtimes.
    // Promise.race guarantees we never hang on a stuck network call.
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    let timeoutId = null;

    const fetchPromise = fetch(url, {
      ...(options || {}),
      ...(controller ? { signal: controller.signal } : {}),
    }).finally(() => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        try {
          controller?.abort();
        } catch {
          // ignore
        }
        const err = new Error(`Request timed out after ${timeoutMs}ms`);
        err.name = "TimeoutError";
        reject(err);
      }, timeoutMs);
    });

    return Promise.race([fetchPromise, timeoutPromise]);
  }, []);

  const loadMatches = useCallback(
    async (userId) => {
      try {
        setError(null);
        const response = await fetchWithTimeout(
          `/api/matches?userId=${userId}`,
          null,
          12000,
        );
        if (!response.ok) {
          throw new Error(
            `When fetching /api/matches, the response was [${response.status}] ${response.statusText}`,
          );
        }
        const data = await response.json();
        const list = data.matches || [];
        setMatches(list);
        setPendingMatchCount(Number(data?.pendingMatchCount) || 0);
        return list;
      } catch (err) {
        const isTimeout =
          String(err?.name || "").toLowerCase() === "timeouterror";

        console.error("Error loading matches:", err);
        setError(
          isTimeout
            ? "Messages are taking too long to load. Please try again."
            : "Could not load matches. Please try again.",
        );
        return [];
      }
    },
    [fetchWithTimeout],
  );

  const loadUserAndMatches = useCallback(async () => {
    try {
      setError(null);

      const ensured = await ensureLegacyUserFromJwt();

      const userData = await AsyncStorage.getItem("user");
      const parsedUser = userData ? JSON.parse(userData) : null;

      // Prefer ensured legacy id when available (keeps date credits + matches in sync).
      let nextUser = parsedUser;
      if (ensured) {
        nextUser = {
          ...(parsedUser || {}),
          ...ensured,
          id: ensured.id,
        };

        try {
          await AsyncStorage.setItem("user", JSON.stringify(nextUser));
        } catch (e) {
          console.error("Could not persist ensured user", e);
        }
      }

      if (!nextUser) {
        setUser(null);
        setMatches([]);
        setPendingMatchCount(0);
        return;
      }

      setUser(nextUser);

      const uid = Number(nextUser?.id);
      if (!Number.isFinite(uid)) {
        setError(
          "Could not load messages (missing user id). Please sign in again.",
        );
        return;
      }

      // IMPORTANT: never block the whole screen on mark-seen.
      markMatchesSeen(uid).catch(() => null);

      await loadMatches(uid);
    } catch (error) {
      console.error("Error loading user:", error);
      setError("Could not load messages. Please try again.");
    } finally {
      didFinishInitialLoadRef.current = true;
      setLoading(false);
    }
  }, [ensureLegacyUserFromJwt, loadMatches, markMatchesSeen]);

  useEffect(() => {
    loadUserAndMatches();
  }, [loadUserAndMatches]);

  useEffect(() => {
    // If something in RN fetch/AsyncStorage ever gets into a weird state,
    // we still stop the spinner and show an error.
    const watchdogMs = 15000;
    const id = setTimeout(() => {
      if (didFinishInitialLoadRef.current) {
        return;
      }
      console.error(
        `Messages watchdog fired after ${watchdogMs}ms (forcing loading=false).`,
      );
      setError("Messages are taking too long to load. Please try again.");
      setLoading(false);
    }, watchdogMs);

    return () => clearTimeout(id);
  }, []);

  return {
    loading,
    matches,
    pendingMatchCount,
    user,
    error,
    loadMatches,
    markMatchesSeen,
  };
}
