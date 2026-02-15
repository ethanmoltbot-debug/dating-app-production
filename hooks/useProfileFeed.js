import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DATING_PREFS_STORAGE_KEY,
  DEFAULT_DATING_PREFERENCES,
  normalizePrefsFromStorage,
} from "@/utils/datingPreferences";

const DEFAULT_FILTERS = {
  minAge: DEFAULT_DATING_PREFERENCES.minAge,
  maxAge: DEFAULT_DATING_PREFERENCES.maxAge,
  maxDistance: DEFAULT_DATING_PREFERENCES.maxDistance,
  gender: DEFAULT_DATING_PREFERENCES.gender,
  passport: { ...DEFAULT_DATING_PREFERENCES.passport },
  minHeightInches: DEFAULT_DATING_PREFERENCES.minHeightInches,
  maxHeightInches: DEFAULT_DATING_PREFERENCES.maxHeightInches,
};

export function useProfileFeed() {
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState(null); // { type: 'pass'|'like', toUserId }

  const normalizeGender = useCallback((value) => {
    const raw = String(value || "")
      .toLowerCase()
      .trim();
    if (raw === "female") return "women";
    if (raw === "male") return "men";
    if (raw === "woman") return "women";
    if (raw === "man") return "men";
    if (raw === "everyone") return "all";
    if (["all", "women", "men", "nonbinary"].includes(raw)) return raw;
    return "all";
  }, []);

  const clampNum = useCallback((n, min, max, fallback) => {
    const num = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, num));
  }, []);

  const loadSavedFilters = useCallback(async () => {
    // Prefer the new key, but fall back to legacy key.
    try {
      const raw = await AsyncStorage.getItem(DATING_PREFS_STORAGE_KEY);
      if (raw) {
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          console.error("Invalid datingPreferences JSON; falling back:", e);
          // If corrupted, clear it so we don't keep failing.
          try {
            await AsyncStorage.removeItem(DATING_PREFS_STORAGE_KEY);
          } catch (err) {
            console.error(err);
          }
        }

        const normalized = normalizePrefsFromStorage(parsed);

        const minAge = clampNum(
          normalized.minAge,
          18,
          98,
          DEFAULT_FILTERS.minAge,
        );
        const maxAge = clampNum(
          normalized.maxAge,
          minAge + 1,
          99,
          Math.max(minAge + 1, DEFAULT_FILTERS.maxAge),
        );
        const maxDistance = clampNum(
          normalized.maxDistance,
          1,
          500,
          DEFAULT_FILTERS.maxDistance,
        );
        const gender = normalizeGender(normalized.gender);

        const passport =
          normalized?.passport && typeof normalized.passport === "object"
            ? normalized.passport
            : DEFAULT_FILTERS.passport;

        const hasCoords =
          Number.isFinite(Number(passport?.lat)) &&
          Number.isFinite(Number(passport?.lng));

        const safePassport = {
          enabled: !!passport?.enabled,
          label: String(passport?.label || ""),
          placeId: passport?.placeId ? String(passport.placeId) : null,
          lat: hasCoords ? Number(passport.lat) : null,
          lng: hasCoords ? Number(passport.lng) : null,
        };

        const minHeightInches = clampNum(
          normalized.minHeightInches,
          36,
          83,
          DEFAULT_FILTERS.minHeightInches,
        );

        const maxHeightInches = clampNum(
          normalized.maxHeightInches,
          minHeightInches + 1,
          84,
          Math.max(minHeightInches + 1, DEFAULT_FILTERS.maxHeightInches),
        );

        return {
          minAge,
          maxAge,
          maxDistance,
          gender,
          passport: safePassport,
          minHeightInches,
          maxHeightInches,
        };
      }
    } catch (e) {
      console.error("Error loading datingPreferences:", e);
    }

    // Legacy key
    try {
      const legacyRaw = await AsyncStorage.getItem("profileFilters");
      const legacyParsed = legacyRaw ? JSON.parse(legacyRaw) : null;
      const minAge = clampNum(
        legacyParsed?.minAge,
        18,
        98,
        DEFAULT_FILTERS.minAge,
      );
      const maxAge = clampNum(
        legacyParsed?.maxAge,
        minAge + 1,
        99,
        Math.max(minAge + 1, DEFAULT_FILTERS.maxAge),
      );
      const maxDistance = clampNum(
        legacyParsed?.maxDistance,
        1,
        500,
        DEFAULT_FILTERS.maxDistance,
      );
      const gender = normalizeGender(
        legacyParsed?.gender || DEFAULT_FILTERS.gender,
      );

      return {
        minAge,
        maxAge,
        maxDistance,
        gender,
        passport: DEFAULT_FILTERS.passport,
        minHeightInches: DEFAULT_FILTERS.minHeightInches,
        maxHeightInches: DEFAULT_FILTERS.maxHeightInches,
      };
    } catch (e) {
      console.error("Error loading legacy profileFilters:", e);
      return { ...DEFAULT_FILTERS };
    }
  }, [clampNum, normalizeGender]);

  useEffect(() => {
    let cancelled = false;

    const loadUserAndFilters = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (!userData) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        let parsedUser = null;
        try {
          parsedUser = JSON.parse(userData);
        } catch (e) {
          console.error("Invalid user JSON; clearing:", e);
          try {
            await AsyncStorage.removeItem("user");
          } catch (err) {
            console.error(err);
          }
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const filterData = await loadSavedFilters();

        if (!cancelled) {
          setUser(parsedUser);
          setFilters(filterData);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };

    loadUserAndFilters();

    return () => {
      cancelled = true;
    };
  }, [loadSavedFilters]);

  // NEW: keep the in-memory user in sync with AsyncStorage.
  // This matters when the user signs in via the WebView auth flow and the app later
  // repairs AsyncStorage via /api/users/ensure (otherwise the feed keeps the stale id).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const syncUserFromStorage = async () => {
        try {
          const raw = await AsyncStorage.getItem("user");
          if (!raw) {
            if (!cancelled) {
              setUser(null);
            }
            return;
          }

          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = null;
          }

          const nextId = Number(parsed?.id);
          const currentId = Number(user?.id);

          const idChanged =
            Number.isFinite(nextId) && Number.isFinite(currentId)
              ? nextId !== currentId
              : Boolean(nextId) !== Boolean(currentId);

          if (!cancelled && idChanged) {
            setUser(parsed);
            setCurrentIndex(0);
            setLastAction(null);
            // Force a refetch with the correct userId.
            queryClient.invalidateQueries({ queryKey: ["profileFeed"] });
          }
        } catch (e) {
          console.error("[FEED] Could not sync user from storage", e);
        }
      };

      syncUserFromStorage();

      return () => {
        cancelled = true;
      };
    }, [queryClient, user?.id]),
  );

  // When we come back from the Preferences screen, reload saved filters and refresh the feed if needed
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const syncFiltersFromStorage = async () => {
        try {
          if (!user?.id) {
            return;
          }

          const nextFilters = await loadSavedFilters();

          const current = JSON.stringify(filters);
          const next = JSON.stringify(nextFilters);

          if (current !== next && isActive) {
            setFilters(nextFilters);
            setCurrentIndex(0);
            setLastAction(null);

            // Invalidate *all* cached feeds for this user (not just the old filter combo)
            queryClient.invalidateQueries({
              queryKey: ["profileFeed", user.id],
            });
          }
        } catch (error) {
          console.error("Error syncing filters:", error);
        }
      };

      syncFiltersFromStorage();

      return () => {
        isActive = false;
      };
    }, [user?.id, filters, loadSavedFilters, queryClient]),
  );

  const profilesQueryKey = useMemo(
    () => ["profileFeed", user?.id || null, filters],
    [user?.id, filters],
  );

  const profilesQuery = useQuery({
    queryKey: profilesQueryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        userId: String(user.id),
        minAge: String(filters.minAge),
        maxAge: String(filters.maxAge),
        maxDistance: String(filters.maxDistance),
        gender: String(filters.gender),
        minHeightInches: String(filters.minHeightInches),
        maxHeightInches: String(filters.maxHeightInches),
      });

      const passportEnabled = !!filters?.passport?.enabled;
      const baseLat = filters?.passport?.lat;
      const baseLng = filters?.passport?.lng;
      const hasBase =
        passportEnabled &&
        Number.isFinite(Number(baseLat)) &&
        Number.isFinite(Number(baseLng));

      if (hasBase) {
        queryParams.set("baseLat", String(baseLat));
        queryParams.set("baseLng", String(baseLng));
      }

      const response = await fetch(`/api/profiles/feed?${queryParams}`);
      if (!response.ok) {
        throw new Error(
          `When fetching /api/profiles/feed, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const data = await response.json();
      return data.profiles || [];
    },
  });

  const profiles = profilesQuery.data || [];

  // If the feed is empty, register for a "more people nearby" push.
  // If it has people again, clear the waitlist.
  useEffect(() => {
    let cancelled = false;

    const syncEmptyFeedWaitlist = async () => {
      try {
        if (!user?.id) {
          return;
        }

        // Only run once we have a resolved fetch (success or error).
        if (!profilesQuery.isSuccess) {
          return;
        }

        const isEmpty = Array.isArray(profiles) && profiles.length === 0;

        const passportEnabled = !!filters?.passport?.enabled;
        const baseLat = filters?.passport?.lat;
        const baseLng = filters?.passport?.lng;
        const hasBase =
          passportEnabled &&
          Number.isFinite(Number(baseLat)) &&
          Number.isFinite(Number(baseLng));

        const body = {
          userId: user.id,
          radiusMiles: filters.maxDistance,
          ...(hasBase ? { lat: Number(baseLat), lng: Number(baseLng) } : {}),
        };

        if (isEmpty) {
          const resp = await fetch("/api/push/empty-feed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!resp.ok) {
            // Non-blocking: this shouldn't break browsing.
            console.error(
              `When calling /api/push/empty-feed, the response was [${resp.status}] ${resp.statusText}`,
            );
          }
        } else {
          const resp = await fetch("/api/push/empty-feed", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });

          if (!resp.ok) {
            // Non-blocking
            console.error(
              `When calling /api/push/empty-feed (DELETE), the response was [${resp.status}] ${resp.statusText}`,
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[PUSH][EMPTY_FEED] sync error", e);
        }
      }
    };

    syncEmptyFeedWaitlist();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    profilesQuery.isSuccess,
    profilesQuery.dataUpdatedAt,
    profiles,
    filters,
  ]);

  useEffect(() => {
    // IMPORTANT: reset position whenever the feed data refreshes,
    // even if the length stays the same (this is what makes the Refresh button "work").
    setCurrentIndex(0);
    setLastAction(null);
  }, [profilesQuery.dataUpdatedAt]);

  const likeMutation = useMutation({
    mutationFn: async ({ toUserId, sectionType, sectionKey, commentText }) => {
      if (!user?.id) {
        throw new Error("User not loaded");
      }

      const response = await fetch("/api/profiles/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: user.id,
          toUserId,
          sectionType,
          sectionKey,
          commentText,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `When fetching /api/profiles/like, the response was [${response.status}] ${response.statusText}`,
        );
      }

      return response.json();
    },
  });

  const passMutation = useMutation({
    mutationFn: async ({ toUserId }) => {
      if (!user?.id) {
        throw new Error("User not loaded");
      }

      const response = await fetch("/api/profiles/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: user.id, toUserId }),
      });

      if (!response.ok) {
        throw new Error(
          `When fetching /api/profiles/pass, the response was [${response.status}] ${response.statusText}`,
        );
      }

      return response.json();
    },
  });

  const undoPassMutation = useMutation({
    mutationFn: async ({ toUserId }) => {
      if (!user?.id) {
        throw new Error("User not loaded");
      }

      const response = await fetch("/api/profiles/pass", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: user.id, toUserId }),
      });

      if (!response.ok) {
        throw new Error(
          `When fetching /api/profiles/pass (DELETE), the response was [${response.status}] ${response.statusText}`,
        );
      }

      return response.json();
    },
  });

  const undoLikeMutation = useMutation({
    mutationFn: async ({ toUserId }) => {
      if (!user?.id) {
        throw new Error("User not loaded");
      }

      const response = await fetch("/api/profiles/like", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: user.id, toUserId }),
      });

      if (!response.ok) {
        throw new Error(
          `When fetching /api/profiles/like (DELETE), the response was [${response.status}] ${response.statusText}`,
        );
      }

      return response.json();
    },
  });

  const likeProfileSection = useCallback(
    async (profileId, section = {}, commentText = null) => {
      const sectionType =
        typeof section?.type === "string" ? section.type : undefined;
      const sectionKey =
        typeof section?.key === "string" ? section.key : undefined;

      try {
        const data = await likeMutation.mutateAsync({
          toUserId: profileId,
          sectionType,
          sectionKey,
          commentText,
        });

        setLastAction({ type: "like", toUserId: profileId });
        return data;
      } catch (error) {
        console.error("Error liking profile:", error);

        // NEW: best-effort retry once.
        // In some TestFlight/network edge cases we can fail locally even though
        // the backend processes the like (and may create the match). This retry
        // is safe because /api/profiles/like is idempotent via ON CONFLICT.
        try {
          const fromUserId = Number(user?.id);
          if (!Number.isFinite(fromUserId)) {
            return null;
          }

          const resp = await fetch("/api/profiles/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromUserId,
              toUserId: profileId,
              sectionType,
              sectionKey,
              commentText,
            }),
          });

          if (!resp.ok) {
            return null;
          }

          const data = await resp.json().catch(() => null);
          if (data) {
            setLastAction({ type: "like", toUserId: profileId });
          }
          return data;
        } catch (e) {
          console.error("Like retry failed:", e);
          return null;
        }
      }
    },
    [likeMutation, user?.id],
  );

  const passProfile = useCallback(
    async (profileId) => {
      try {
        await passMutation.mutateAsync({ toUserId: profileId });
        setLastAction({ type: "pass", toUserId: profileId });
      } catch (error) {
        console.error("Error passing profile:", error);
      }
    },
    [passMutation],
  );

  const nextProfile = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const canRewind =
    (lastAction?.type === "pass" || lastAction?.type === "like") &&
    !!lastAction?.toUserId &&
    currentIndex > 0;

  const rewind = useCallback(async () => {
    try {
      if (!canRewind) {
        return false;
      }

      const toUserId = lastAction.toUserId;

      if (lastAction.type === "pass") {
        await undoPassMutation.mutateAsync({ toUserId });
      }

      if (lastAction.type === "like") {
        await undoLikeMutation.mutateAsync({ toUserId });
      }

      setCurrentIndex((prev) => Math.max(prev - 1, 0));
      setLastAction(null);

      return true;
    } catch (error) {
      console.error("Error rewinding:", error);
      // Even if undo fails, still let the user go back for a smoother UX.
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
      setLastAction(null);
      return false;
    }
  }, [canRewind, lastAction, undoLikeMutation, undoPassMutation]);

  const refresh = useCallback(async () => {
    try {
      setCurrentIndex(0);
      setLastAction(null);
      await profilesQuery.refetch();
    } catch (error) {
      console.error("Error refreshing feed:", error);
      // Fallback: invalidate to try again on next render.
      queryClient.invalidateQueries({ queryKey: profilesQueryKey });
    }
  }, [profilesQuery, profilesQueryKey, queryClient]);

  const loading = profilesQuery.isLoading;
  const refreshing = profilesQuery.isFetching;

  return {
    loading,
    refreshing,
    profiles,
    currentIndex,
    user,
    filters,
    setFilters,
    likeProfileSection,
    passProfile,
    nextProfile,
    canRewind,
    rewind,
    refresh,
    feedError: profilesQuery.isError
      ? String(profilesQuery.error?.message || "")
      : null,
  };
}

export { DEFAULT_FILTERS };
