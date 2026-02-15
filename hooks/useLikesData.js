import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useLikesData() {
  const queryClient = useQueryClient();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const userQuery = useQuery({
    queryKey: ["storedUser"],
    queryFn: async () => {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Invalid user JSON in AsyncStorage; clearing:", e);
        try {
          await AsyncStorage.removeItem("user");
        } catch (err) {
          console.error(err);
        }
        return null;
      }
    },
  });

  const user = userQuery.data;
  const userId = user?.id;
  const userEmail = user?.email;

  const likesQuery = useQuery({
    queryKey: ["likesMe", userId || null, userEmail || null],
    enabled: !!userId || !!userEmail,
    queryFn: async () => {
      const params = [];
      if (userId) {
        params.push(`userId=${encodeURIComponent(String(userId))}`);
      }
      if (userEmail) {
        params.push(`email=${encodeURIComponent(String(userEmail))}`);
      }
      const queryString = params.length ? `?${params.join("&")}` : "";

      const response = await fetch(`/api/likes/me${queryString}`);
      if (!response.ok) {
        throw new Error(
          `When fetching /api/likes/me, the response was [${response.status}] ${response.statusText}`,
        );
      }

      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: false,
    retry: 1,
  });

  const effectiveUserId = useMemo(() => {
    // IMPORTANT: /api/likes/me can map email -> users.id.
    // If AsyncStorage is stale (common after deleting/recreating accounts),
    // actions like "like back" must use the resolved id or matches won't form.
    const resolved = Number(likesQuery.data?.resolvedUserId);
    if (Number.isFinite(resolved)) {
      return resolved;
    }

    const stored = Number(userId);
    return Number.isFinite(stored) ? stored : null;
  }, [likesQuery.data?.resolvedUserId, userId]);

  // Best-effort: if the backend resolved a different userId for this email,
  // rewrite AsyncStorage so the rest of the app (feed, push registration, etc.) stays consistent.
  useEffect(() => {
    const resolved = Number(likesQuery.data?.resolvedUserId);
    const stored = Number(userId);

    const shouldUpdate =
      Number.isFinite(resolved) &&
      Number.isFinite(stored) &&
      resolved !== stored &&
      !!userEmail;

    if (!shouldUpdate) {
      return;
    }

    (async () => {
      try {
        const merged = { ...(user || {}), id: resolved, email: userEmail };
        await AsyncStorage.setItem("user", JSON.stringify(merged));
        // Make sure any other screens that rely on the cached user reload quickly.
        queryClient.invalidateQueries({ queryKey: ["storedUser"] });
      } catch (e) {
        console.error("[LIKES] Could not update cached userId", e);
      }
    })();
  }, [likesQuery.data?.resolvedUserId, queryClient, user, userEmail, userId]);

  const likes = likesQuery.data?.likes || [];

  const likeBackMutation = useMutation({
    mutationFn: async ({ profileId }) => {
      const fromUserId = Number(effectiveUserId);
      if (!Number.isFinite(fromUserId)) {
        throw new Error("User not loaded");
      }

      const response = await fetch("/api/profiles/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId, toUserId: profileId }),
      });

      if (!response.ok) {
        throw new Error(
          `When fetching /api/profiles/like, the response was [${response.status}] ${response.statusText}`,
        );
      }

      return response.json();
    },
    onMutate: async ({ profileId }) => {
      await queryClient.cancelQueries({
        queryKey: ["likesMe", userId || null, userEmail || null],
      });

      const previous = queryClient.getQueryData([
        "likesMe",
        userId || null,
        userEmail || null,
      ]);

      queryClient.setQueryData(
        ["likesMe", userId || null, userEmail || null],
        (old) => {
          const oldLikes = old?.likes || [];
          const nextLikes = oldLikes.filter((x) => x?.id !== profileId);
          return { ...(old || {}), likes: nextLikes };
        },
      );

      // NEW: best-effort remove this profile from any cached Discover feed arrays
      // so they don't pop up again after a like-back.
      try {
        if (
          effectiveUserId &&
          typeof queryClient.setQueriesData === "function"
        ) {
          queryClient.setQueriesData(
            { queryKey: ["profileFeed", Number(effectiveUserId)] },
            (old) => {
              if (!Array.isArray(old)) return old;
              const pid = Number(profileId);
              return old.filter((p) => Number(p?.id) !== pid);
            },
          );
        }
      } catch (e) {
        console.error(e);
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      console.error("Error liking back:", error);
      if (context?.previous) {
        queryClient.setQueryData(
          ["likesMe", userId || null, userEmail || null],
          context.previous,
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["likesMe", userId || null, userEmail || null],
      });

      if (effectiveUserId) {
        queryClient.invalidateQueries({
          queryKey: ["matchesSummary", Number(effectiveUserId)],
        });
        queryClient.invalidateQueries({
          queryKey: ["matches", Number(effectiveUserId)],
        });

        // NEW: also invalidate the Discover feed so a matched/liked user doesn't
        // linger in an existing cache.
        queryClient.invalidateQueries({
          queryKey: ["profileFeed", Number(effectiveUserId)],
        });
      }

      // If we know who was liked back, remove from cached feed again after settle
      // (covers cases where the feed was fetched after onMutate ran).
      try {
        const profileId = variables?.profileId;
        if (
          effectiveUserId &&
          profileId &&
          typeof queryClient.setQueriesData === "function"
        ) {
          queryClient.setQueriesData(
            { queryKey: ["profileFeed", Number(effectiveUserId)] },
            (old) => {
              if (!Array.isArray(old)) return old;
              const pid = Number(profileId);
              return old.filter((p) => Number(p?.id) !== pid);
            },
          );
        }
      } catch (e) {
        console.error(e);
      }
    },
  });

  const handleLikeBack = useCallback(
    (profile) => {
      if (!profile?.id) return;
      return likeBackMutation.mutate({ profileId: profile.id, profile });
    },
    [likeBackMutation],
  );

  const onPullToRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await likesQuery.refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [likesQuery]);

  return {
    user,
    userId: effectiveUserId,
    userEmail,
    likes,
    userQuery,
    likesQuery,
    likeBackMutation,
    handleLikeBack,
    isPullRefreshing,
    onPullToRefresh,
  };
}
