import { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

export default function useMatchesBadge() {
  const [userId, setUserId] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (!raw) {
          if (!cancelled) setUserId(null);
          return false;
        }
        const user = JSON.parse(raw);

        // IMPORTANT: normalize to a number so react-query keys match invalidations
        // elsewhere in the app (which always use Number(userId)).
        const parsed = Number(user?.id);
        const nextId = Number.isFinite(parsed) ? parsed : null;

        if (!cancelled) {
          setUserId(nextId);
        }
        return Boolean(nextId);
      } catch (e) {
        console.error(e);
        if (!cancelled) setUserId(null);
        return false;
      }
    };

    // IMPORTANT: Root layouts can mount before login finishes.
    // Keep checking until a user appears so the badge works right after sign-in.
    load().then((found) => {
      if (cancelled) return;
      if (found) return;

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      pollRef.current = setInterval(() => {
        if (cancelled) return;
        load().then((nowFound) => {
          if (cancelled) return;
          if (nowFound && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        });
      }, 1500);
    });

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  // IMPORTANT: We use the same /api/matches endpoint as the Messages screen.
  // This avoids the "badge shows 0 until I open Messages" problem.
  const matchesQuery = useQuery({
    queryKey: ["matchesForBadge", userId],
    enabled: Number.isFinite(Number(userId)),
    queryFn: async () => {
      const response = await fetch(`/api/matches?userId=${userId}`);
      if (!response.ok) {
        throw new Error(
          `When fetching /api/matches for badge, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const matches = Array.isArray(matchesQuery.data?.matches)
    ? matchesQuery.data.matches
    : [];

  const unseenMatches = matches.reduce((sum, m) => {
    return sum + (m?.is_new_match ? 1 : 0);
  }, 0);

  const unreadMessages = matches.reduce((sum, m) => {
    const n = Number(m?.unread_count) || 0;
    return sum + n;
  }, 0);

  const badgeCount = unseenMatches + unreadMessages;

  return {
    userId,
    unseenMatches,
    unreadMessages,
    badgeCount,
    isLoading: matchesQuery.isLoading,
    refetch: matchesQuery.refetch,
  };
}
