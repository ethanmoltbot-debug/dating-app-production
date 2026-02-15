import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

function buildLikesQueryString({ userId, userEmail }) {
  const params = [];
  const uid = Number(userId);

  if (Number.isFinite(uid)) {
    params.push(`userId=${encodeURIComponent(String(uid))}`);
  }

  const email = String(userEmail || "").trim();
  if (email) {
    params.push(`email=${encodeURIComponent(email)}`);
  }

  return params.length ? `?${params.join("&")}` : "";
}

export default function useLikesBadge() {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (!raw) {
          if (!cancelled) {
            setUserId(null);
            setUserEmail(null);
          }
          return false;
        }

        const user = JSON.parse(raw);
        const parsedId = Number(user?.id);
        const nextId = Number.isFinite(parsedId) ? parsedId : null;
        const nextEmail = String(user?.email || "").trim() || null;

        if (!cancelled) {
          setUserId(nextId);
          setUserEmail(nextEmail);
        }

        return Boolean(nextId || nextEmail);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setUserId(null);
          setUserEmail(null);
        }
        return false;
      }
    };

    // Root layouts can mount before login finishes.
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

  const badgeQuery = useQuery({
    queryKey: ["likesBadge", userId || null, userEmail || null],
    enabled: Boolean(userId || userEmail),
    queryFn: async () => {
      const queryString = buildLikesQueryString({ userId, userEmail });
      const response = await fetch(`/api/likes/badge${queryString}`);
      if (!response.ok) {
        throw new Error(
          `When fetching /api/likes/badge, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    // Keep this lightweight; it only drives a small dot.
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: 1,
  });

  const badgeCountRaw = badgeQuery.data?.badgeCount;
  const badgeCountNum = Number(badgeCountRaw);
  const badgeCount = Number.isFinite(badgeCountNum) ? badgeCountNum : 0;

  return {
    userId,
    userEmail,
    badgeCount,
    isLoading: badgeQuery.isLoading,
    refetch: badgeQuery.refetch,
  };
}
