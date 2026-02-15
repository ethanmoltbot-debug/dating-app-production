import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";

export function useConversation(matchId) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [matchInfo, setMatchInfo] = useState(null);
  const [error, setError] = useState(null);

  // Prevent "Too Many Requests" bursts when multiple parts of the chat
  // screen trigger a refresh at the same time (tab switches, mutations, etc).
  const messagesAbortRef = useRef(null);
  const messagesInFlightRef = useRef(false);
  const lastMessagesFetchAtRef = useRef(0);
  const rateLimitedUntilRef = useRef(0);

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
            queryKey: ["matchesSummary", userId],
          });
          // NEW: keep the Messages tab dot in sync immediately (don’t wait for polling)
          queryClient.invalidateQueries({
            queryKey: ["matchesForBadge", userId],
          });
        }
      } catch (e) {
        console.error("Could not mark matches seen", e);
      }
    },
    [queryClient],
  );

  const loadMatchInfo = async (userId) => {
    if (!matchId) return;
    try {
      const response = await fetch(`/api/matches/${matchId}?userId=${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setMatchInfo(null);
          setError((prev) => prev || "This match is no longer available.");
          return;
        }

        // When the backend is sleeping / proxy can't reach it, avoid scary gateway text.
        if (
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          setMatchInfo(null);
          setError(
            (prev) =>
              prev || "Server is starting up. Please try again in a moment.",
          );
          return;
        }

        const text = await response.text().catch(() => "");
        throw new Error(
          `When fetching /api/matches/${matchId}, the response was [${response.status}] ${response.statusText} ${text}`,
        );
      }
      const data = await response.json();
      setMatchInfo(data?.match || null);
    } catch (err) {
      console.error("Error loading match info:", err);
      setMatchInfo(null);

      // Only set the UI error if one isn't already set (messages might set it first).
      setError(
        (prev) =>
          prev ||
          (err?.message ? String(err.message) : "Could not load match info."),
      );
    }
  };

  const loadMessages = useCallback(
    async (userId) => {
      if (!matchId) return;

      const now = Date.now();
      if (now < rateLimitedUntilRef.current) {
        return;
      }

      // throttle: avoid accidental double-fetch on mount / tab switch
      if (now - lastMessagesFetchAtRef.current < 750) {
        return;
      }

      // Abort any in-flight request; we only care about the latest.
      try {
        if (messagesAbortRef.current) {
          messagesAbortRef.current.abort();
        }
      } catch {
        // ignore
      }

      const controller = new AbortController();
      messagesAbortRef.current = controller;
      lastMessagesFetchAtRef.current = now;

      // prevent re-entrancy
      if (messagesInFlightRef.current) {
        return;
      }

      messagesInFlightRef.current = true;

      try {
        const response = await fetch(
          `/api/messages/${matchId}?userId=${userId}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Soft-fail: keep the last good messages on screen and back off.
            rateLimitedUntilRef.current = Date.now() + 1500;
            return;
          }

          if (response.status === 404) {
            setMessages([]);
            setError("This chat is no longer available.");
            return;
          }

          if (response.status === 410) {
            setMessages([]);
            setError("This match is no longer available.");
            return;
          }

          // When the backend is sleeping / proxy can't reach it, avoid scary gateway text.
          if (
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504
          ) {
            setMessages([]);
            setError("Server is starting up. Please try again in a moment.");
            return;
          }

          const text = await response.text().catch(() => "");
          throw new Error(
            `When fetching /api/messages/${matchId}, the response was [${response.status}] ${response.statusText} ${text}`,
          );
        }

        const data = await response.json();
        const nextMessages = Array.isArray(data?.messages) ? data.messages : [];
        setMessages(nextMessages);

        // Existing: keep any cached match summaries fresh
        queryClient.invalidateQueries({ queryKey: ["matchesSummary", userId] });

        // /api/messages marks the one-time "SYSTEM_HINT" as read.
        queryClient.invalidateQueries({
          queryKey: ["matchesForBadge", userId],
        });
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }

        console.error("Error loading messages:", err);
        setError(
          err?.message
            ? String(err.message)
            : "Could not load messages for this match.",
        );
      } finally {
        messagesInFlightRef.current = false;
      }
    },
    [matchId, queryClient],
  );

  const loadUserAndMessages = async () => {
    if (!matchId) {
      setLoading(true);
      return;
    }

    try {
      setError(null);
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        setUser(null);
        setError("You need to log in again.");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      await markMatchesSeen(parsedUser.id);
      await Promise.all([
        loadMatchInfo(parsedUser.id),
        loadMessages(parsedUser.id),
      ]);
    } catch (err) {
      console.error("Error loading conversation:", err);
      setError(
        err?.message ? String(err.message) : "Could not load this chat.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // IMPORTANT: matchId can arrive slightly after first render in expo-router.
    // If we only run once, the thread will never load.
    loadUserAndMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const reloadMessages = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    if (!matchId) return;
    await loadMessages(uid);
  }, [loadMessages, matchId, user?.id]);

  return {
    loading,
    error,
    messages,
    setMessages,
    user,
    matchInfo,
    reloadMessages,
  };
}
