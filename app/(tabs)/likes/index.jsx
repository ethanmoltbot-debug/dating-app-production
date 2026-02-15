import { useCallback, useMemo, useState } from "react";
import { RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAuth } from "@/utils/auth/useAuth";
import { usePresencePing } from "@/hooks/usePresencePing";
import { useSubscription } from "@/utils/subscription";
import { MatchModal } from "@/components/MatchModal/MatchModal";
import { useLikesData } from "@/hooks/useLikesData";
import { LikesHeader } from "@/components/LikesScreen/LikesHeader";
import { BackgroundBlobs } from "@/components/LikesScreen/BackgroundBlobs";
import { EmptyLikesState } from "@/components/LikesScreen/EmptyLikesState";
import { LikesGrid } from "@/components/LikesScreen/LikesGrid";
import { LoadingState } from "@/components/LikesScreen/LoadingState";
import { SessionNotFoundState } from "@/components/LikesScreen/SessionNotFoundState";
import { InitialLoadingState } from "@/components/LikesScreen/InitialLoadingState";
import {
  BG_GRADIENT,
  ACCENT,
  FREE_VISIBLE_COUNT,
  HEADER_TITLE,
  HEADER_SUBTITLE,
  ILLUSTRATION_URI,
} from "@/utils/likesConstants";

export default function LikesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [matchedMatchId, setMatchedMatchId] = useState(null);

  const { isCommitted, refresh: refreshSubscription } = useSubscription();
  const isLocked = !isCommitted;

  const {
    user,
    userId,
    userEmail,
    likes,
    userQuery,
    likesQuery,
    likeBackMutation,
    handleLikeBack,
    isPullRefreshing,
    onPullToRefresh,
  } = useLikesData();

  usePresencePing(userId, { enabled: Boolean(userId) });

  // while this tab is focused, poll for new likes so they "pop in" without a restart.
  useFocusEffect(
    useCallback(() => {
      // Critical: when coming back from the subscription screen, this tab stays mounted.
      // So we need to refresh the RevenueCat status on focus.
      refreshSubscription?.().catch(() => null);

      const canFetch = Boolean(userId || userEmail);
      if (canFetch) {
        likesQuery.refetch();
      }

      if (!canFetch) {
        return;
      }

      const intervalId = setInterval(() => {
        likesQuery.refetch();
      }, 12000);

      return () => {
        clearInterval(intervalId);
      };
    }, [refreshSubscription, userId, userEmail, likesQuery]),
  );

  const onUpgrade = useCallback(
    (displayName) => {
      const safeName = String(displayName || "").trim();
      const qs = new URLSearchParams({
        returnTo: "/likes",
        intent: "likes_locked",
        tier: "committed",
      });

      if (safeName) {
        qs.set("name", safeName);
      }

      router.push(`/subscription?${qs.toString()}`);
    },
    [router],
  );

  const handleLikeBackWithMatch = useCallback(
    async (profile) => {
      if (!profile?.id) return;

      // Product rule: liking back from Likes requires Committed.
      if (!isCommitted) {
        // When returning from the paywall, the Likes screen can still have stale tier state.
        // Re-check once before sending the user back to the subscription screen.
        const tierNow = await refreshSubscription?.().catch(() => null);
        if (tierNow !== "committed") {
          onUpgrade(profile?.display_name);
          return;
        }
      }

      try {
        const data = await likeBackMutation.mutateAsync({
          profileId: profile.id,
          profile,
        });

        if (data?.isMatch) {
          setMatchedUser(profile);
          setMatchedMatchId(data?.matchId || null);
          setShowMatch(true);
        }
      } catch (e) {
        console.error(e);
        Alert.alert(
          "Could not like back",
          "Please try again. If it still created a match, you’ll see them in Messages.",
        );

        // Best-effort: refresh so we reflect server state (sometimes the request succeeds
        // but the client sees a network error).
        try {
          await likesQuery.refetch();
        } catch (err) {
          console.error(err);
        }
      }
    },
    [isCommitted, likeBackMutation, likesQuery, onUpgrade, refreshSubscription],
  );

  const openProfile = useCallback(
    async (profileId) => {
      const idNum = Number(profileId);
      if (!Number.isFinite(idNum)) return;

      if (!isCommitted) {
        // Avoid the annoying loop: user just subscribed, taps a card, and we send them
        // right back to /subscription because the tier state hasn't refreshed yet.
        const tierNow = await refreshSubscription?.().catch(() => null);
        if (tierNow !== "committed") {
          onUpgrade();
          return;
        }
      }

      // IMPORTANT:
      // Open the profile *inside the Likes tab stack* so the bottom tab bar stays visible.
      router.push(`/likes/profile/${String(idNum)}?fromLikes=1`);
    },
    [isCommitted, onUpgrade, refreshSubscription, router],
  );

  const refreshControl = useMemo(() => {
    return (
      <RefreshControl
        refreshing={Boolean(isPullRefreshing)}
        onRefresh={onPullToRefresh}
        tintColor={ACCENT}
      />
    );
  }, [isPullRefreshing, onPullToRefresh]);

  const isLoading = userQuery.isLoading;
  const showLoadingState = likesQuery.isLoading || likesQuery.isError;
  const loadingLabel = likesQuery.isError ? "Reconnecting…" : "Loading likes…";

  if (isLoading) {
    return <InitialLoadingState />;
  }

  if (!userId && !userEmail) {
    return (
      <SessionNotFoundState
        insets={insets}
        title={HEADER_TITLE}
        subtitle={HEADER_SUBTITLE}
        onSignIn={signIn}
      />
    );
  }

  return (
    <LinearGradient
      colors={BG_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar style="dark" />

      <BackgroundBlobs />

      <LikesHeader
        insets={insets}
        title={HEADER_TITLE}
        subtitle={HEADER_SUBTITLE}
      />

      {showLoadingState ? (
        <LoadingState label={loadingLabel} />
      ) : likes.length === 0 ? (
        <EmptyLikesState
          insets={insets}
          illustrationUri={ILLUSTRATION_URI}
          onUpgrade={() => onUpgrade()}
          refreshControl={refreshControl}
        />
      ) : (
        <LikesGrid
          likes={likes}
          isLocked={isLocked}
          freeVisibleCount={FREE_VISIBLE_COUNT}
          insets={insets}
          refreshControl={refreshControl}
          onUpgrade={onUpgrade}
          onOpenProfile={openProfile}
          onLikeBack={handleLikeBackWithMatch}
          isLiking={likeBackMutation.isPending}
        />
      )}

      <MatchModal
        visible={showMatch}
        matchedUser={matchedUser}
        matchId={matchedMatchId}
        currentUserId={userId}
        onClose={() => {
          setShowMatch(false);
          setMatchedUser(null);
          setMatchedMatchId(null);
        }}
      />
    </LinearGradient>
  );
}
