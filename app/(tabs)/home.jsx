import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useProfileFeed } from "@/hooks/useProfileFeed";
import { useSubscription } from "@/utils/subscription";
import { MatchModal } from "@/components/MatchModal/MatchModal";
import { HomeHeader } from "@/components/HomeHeader/HomeHeader";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ProfilePreviewContent } from "@/components/ProfilePreview/ProfilePreviewContent";
import SectionCommentModal from "@/components/SectionCommentModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TutorialOverlay from "@/components/Tutorial/TutorialOverlay";

function SoftBlobsBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -80,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: "rgba(255, 79, 216, 0.16)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 120,
          right: -110,
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: "rgba(124, 58, 237, 0.14)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -120,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: "rgba(99, 179, 237, 0.16)",
        }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { isCommitted, loading: subscriptionLoading } = useSubscription();

  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [matchedMatchId, setMatchedMatchId] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const [commentTarget, setCommentTarget] = useState(null);
  const [commentOpen, setCommentOpen] = useState(false);

  const locationAttemptedRef = useRef(false);

  const {
    loading,
    refreshing,
    profiles,
    currentIndex,
    user,
    filters,
    likeProfileSection,
    passProfile,
    nextProfile: moveToNextProfile,
    canRewind,
    rewind,
    refresh,
    feedError,
  } = useProfileFeed();

  const passportBadgeLabel = useMemo(() => {
    const enabled = !!filters?.passport?.enabled;
    const label = String(filters?.passport?.label || "").trim();
    if (!enabled) return "";
    if (!label) return "";
    return label;
  }, [filters?.passport?.enabled, filters?.passport?.label]);

  const passportHeroBadgeText = useMemo(() => {
    const label = String(passportBadgeLabel || "").trim();
    if (!label) return "";
    return `✈️ ${label}`;
  }, [passportBadgeLabel]);

  const [tutorialStep, setTutorialStep] = useState(-1);

  const tutorialSteps = useMemo(() => {
    return [
      {
        title: "Quick tip",
        body: "See someone you’re into? Send them a like or comment to let them know you’re interested.",
        placement: { type: "bottom" },
        targetKey: "like",
      },
      {
        title: "Photos",
        body: "Tap any photo to view it full screen. Swipe to see more, and pinch to zoom.",
        placement: { type: "bottom" },
        targetKey: "photo",
      },
      {
        title: "Filters",
        body: "Want to narrow it down? Use filters up top to adjust age, distance, and more.",
        placement: { type: "top" },
        targetKey: "filter",
      },
    ];
  }, []);

  const tutorialKey = useMemo(() => {
    // versioned so we can change copy later without breaking old users
    return "wifey:tutorial:v1:home";
  }, []);

  const tutorialKeysToReset = useMemo(() => {
    // Handy for QA: reset all tutorial popups (home + messages + profile)
    return [
      "wifey:tutorial:v1:home",
      "wifey:tutorial:v1:messages",
      "wifey:tutorial:v1:profile",
    ];
  }, []);

  useEffect(() => {
    let cancelled = false;

    const maybeShowTutorial = async () => {
      try {
        if (!user?.id) {
          return;
        }

        // Only show once the user is fully in the app.
        if (user?.status !== "APPROVED") {
          return;
        }

        const seen = await AsyncStorage.getItem(tutorialKey);
        if (!cancelled && !seen) {
          setTutorialStep(0);
        }
      } catch (e) {
        console.error(e);
      }
    };

    maybeShowTutorial();

    return () => {
      cancelled = true;
    };
  }, [tutorialKey, user?.id, user?.status]);

  const resetTutorialsForTesting = useCallback(() => {
    // Keep it hidden behind a long-press so normal users never hit it by accident.
    Alert.alert(
      "Reset tips?",
      "This will show the quick tips again the next time you open these tabs.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                tutorialKeysToReset.map((k) => AsyncStorage.removeItem(k)),
              );

              // Immediately re-show the Home tips if user is eligible.
              if (user?.id && user?.status === "APPROVED") {
                setTutorialStep(0);
              }
            } catch (e) {
              console.error(e);
            }
          },
        },
      ],
    );
  }, [tutorialKeysToReset, user?.id, user?.status]);

  const dismissTutorial = useCallback(async () => {
    try {
      setTutorialStep(-1);
      await AsyncStorage.setItem(tutorialKey, "1");
    } catch (e) {
      console.error(e);
      setTutorialStep(-1);
    }
  }, [tutorialKey]);

  const advanceTutorial = useCallback(() => {
    setTutorialStep((s) => {
      const next = s + 1;
      if (next >= tutorialSteps.length) {
        dismissTutorial();
        return -1;
      }
      return next;
    });
  }, [dismissTutorial, tutorialSteps.length]);

  useEffect(() => {
    const maybeUpdateMyLocation = async () => {
      try {
        if (!user?.id) {
          return;
        }
        if (locationAttemptedRef.current) {
          return;
        }
        locationAttemptedRef.current = true;

        if (Platform.OS === "web") {
          return;
        }

        // IMPORTANT: don't auto-trigger the system location prompt here.
        // Location permission prompts should happen only when the user taps "Allow"
        // in onboarding / settings.
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm?.status !== "granted") {
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        if (typeof lat !== "number" || typeof lng !== "number") {
          return;
        }

        // Save coords to the profile so the backend can calculate distances.
        const resp = await fetch("/api/profile/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, lat, lng }),
        });

        // If we successfully saved location, refresh feed so distances appear.
        if (resp.ok) {
          await refresh();
        }
      } catch (e) {
        console.error("Could not update location:", e);
      }
    };

    maybeUpdateMyLocation();
  }, [user?.id, refresh]);

  const handleHeaderLayout = useCallback(
    (e) => {
      const h = e?.nativeEvent?.layout?.height || 0;
      if (h && h !== headerHeight) {
        setHeaderHeight(h);
      }
    },
    [headerHeight],
  );

  const handleFilterPress = useCallback(() => {
    router.push("/filters");
  }, [router]);

  const filterBtnRef = useRef(null);
  const [filterBtnRect, setFilterBtnRect] = useState(null);

  const heroLikeBtnRef = useRef(null);
  const [heroLikeRect, setHeroLikeRect] = useState(null);

  const heroPhotoRef = useRef(null);
  const [heroPhotoRect, setHeroPhotoRect] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const targetKey =
      tutorialStep >= 0 ? tutorialSteps[tutorialStep]?.targetKey : null;

    const measureRef = (ref, setter) => {
      try {
        const node = ref?.current;
        if (!node || typeof node.measureInWindow !== "function") {
          return;
        }

        node.measureInWindow((x, y, width, height) => {
          if (cancelled) return;
          if (![x, y, width, height].every(Number.isFinite)) return;
          setter({ x, y, width, height });
        });
      } catch (e) {
        console.error(e);
      }
    };

    // Clear rects when not targeting them
    if (targetKey !== "filter") setFilterBtnRect(null);
    if (targetKey !== "like") setHeroLikeRect(null);
    if (targetKey !== "photo") setHeroPhotoRect(null);

    if (!targetKey) {
      return () => {
        cancelled = true;
      };
    }

    // Give layout a beat to settle (especially on first render)
    const t = setTimeout(() => {
      if (targetKey === "filter") {
        measureRef(filterBtnRef, setFilterBtnRect);
      }
      if (targetKey === "like") {
        measureRef(heroLikeBtnRef, setHeroLikeRect);
      }
      if (targetKey === "photo") {
        measureRef(heroPhotoRef, setHeroPhotoRect);
      }
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [tutorialStep, tutorialSteps]);

  const isEmpty = currentIndex >= profiles.length;
  const currentProfile = profiles[currentIndex];

  const currentPreferences = useMemo(() => {
    const raw = currentProfile?.preferences;
    const ok = raw && typeof raw === "object";
    return ok ? raw : {};
  }, [currentProfile?.preferences]);

  const handlePass = useCallback(async () => {
    if (!currentProfile || !user) {
      return;
    }

    await passProfile(currentProfile.id);
    moveToNextProfile();
  }, [currentProfile, moveToNextProfile, passProfile, user]);

  const handleRewind = useCallback(async () => {
    try {
      await rewind();
    } catch (e) {
      console.error(e);
    }
  }, [rewind]);

  // Single heart button per section: tapping it opens the "like/comment" modal.
  const handlePressSectionHeart = useCallback(
    (sectionMeta) => {
      setCommentTarget(sectionMeta);
      setCommentOpen(true);
    },
    [setCommentOpen, setCommentTarget],
  );

  const handleSubmitFromModal = useCallback(
    async (commentText) => {
      if (!currentProfile || !user) {
        setCommentOpen(false);
        setCommentTarget(null);
        return;
      }

      const target = commentTarget;
      setCommentOpen(false);
      setCommentTarget(null);

      // commentText can be null (like-only) or a string (comment)
      const result = await likeProfileSection(
        currentProfile.id,
        target,
        commentText,
      );

      if (result?.isMatch) {
        setMatchedUser(currentProfile);
        setMatchedMatchId(result?.matchId || null);
        setShowMatch(true);
      }

      moveToNextProfile();
    },
    [
      commentTarget,
      currentProfile,
      likeProfileSection,
      moveToNextProfile,
      user,
    ],
  );

  const profileKey = currentProfile?.id
    ? `hinge-browse-${currentProfile.id}`
    : "hinge-browse";

  const commentProfileName = currentProfile?.display_name || "";
  const commentSectionLabel = commentTarget?.label || "";

  // Keep the same pastel scheme as Likes + Messages
  const gradientColors = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const accent = "#A855F7";

  const tutorial = tutorialStep >= 0 ? tutorialSteps[tutorialStep] : null;

  const tutorialPlacement = useMemo(() => {
    if (!tutorial) return null;

    const type = tutorial?.placement?.type === "top" ? "top" : "bottom";

    if (type === "top") {
      // place right under the header
      return { type: "top", inset: insets.top + headerHeight + 14 };
    }

    // float above the bottom controls
    return { type: "bottom", inset: insets.bottom + 140 };
  }, [headerHeight, insets.bottom, insets.top, tutorial]);

  const tutorialTargetRect = useMemo(() => {
    if (!tutorial) return null;

    if (tutorial.targetKey === "filter") return filterBtnRect;
    if (tutorial.targetKey === "like") return heroLikeRect;
    if (tutorial.targetKey === "photo") return heroPhotoRect;

    return null;
  }, [filterBtnRect, heroLikeRect, heroPhotoRect, tutorial]);

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SoftBlobsBackground />
        <StatusBar style="dark" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={accent} />
        </View>
      </View>
    );
  }

  // If the feed can't load, don't show "No More Profiles" (it's misleading)
  if (feedError) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SoftBlobsBackground />
        <StatusBar style="dark" />
        <EmptyState
          onRefresh={refresh}
          topInset={insets.top}
          refreshing={refreshing}
          variant="light"
          title="Couldn’t load profiles"
          subtitle="Tap refresh to try again"
          hideEmoji
        />
      </View>
    );
  }

  // If user isn't available (local cache missing), show a clearer state.
  if (!user?.id) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SoftBlobsBackground />
        <StatusBar style="dark" />
        <EmptyState
          onRefresh={refresh}
          topInset={insets.top}
          refreshing={refreshing}
          variant="light"
          title="Session not found"
          subtitle="Please sign in again to see profiles"
          hideEmoji
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />
      <StatusBar style="dark" />

      {/* Header overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <HomeHeader
          onFilterPress={handleFilterPress}
          onRewindPress={handleRewind}
          canRewind={canRewind}
          topInset={insets.top}
          onLayout={handleHeaderLayout}
          filterRef={filterBtnRef}
          onTitleLongPress={resetTutorialsForTesting}
          style={{
            backgroundColor: "rgba(255,255,255,0.84)",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(17,17,17,0.06)",
          }}
          variant="light"
        />
      </View>

      {/* Main content gets pushed down by the header height */}
      <View style={{ flex: 1, paddingTop: headerHeight }}>
        {isEmpty ? (
          <View style={{ flex: 1 }}>
            <EmptyState
              onRefresh={refresh}
              topInset={0}
              refreshing={refreshing}
              variant="light"
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ProfilePreviewContent
              key={profileKey}
              profile={currentProfile}
              preferences={currentPreferences}
              screenBackgroundColor="transparent"
              bottomInset={insets.bottom + 120}
              showSectionActions
              onLikeSection={handlePressSectionHeart}
              showDatingInsights={!subscriptionLoading && isCommitted}
              tutorialHeroLikeRef={heroLikeBtnRef}
              tutorialHeroPhotoRef={heroPhotoRef}
              heroTopLeftBadgeText={passportHeroBadgeText}
            />

            {/* X button bottom-left (Hinge-style pass) */}
            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                left: 18,
                bottom: insets.bottom + 18,
              }}
            >
              <TouchableOpacity
                onPress={handlePass}
                activeOpacity={0.85}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "rgba(255,255,255,0.90)",
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                }}
              >
                <X size={34} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <SectionCommentModal
        visible={commentOpen}
        profileName={commentProfileName}
        sectionLabel={commentSectionLabel}
        sectionMeta={commentTarget}
        onClose={() => {
          setCommentOpen(false);
          setCommentTarget(null);
        }}
        onSubmit={handleSubmitFromModal}
      />

      <MatchModal
        visible={showMatch}
        matchedUser={matchedUser}
        matchId={matchedMatchId}
        currentUserId={user?.id}
        onClose={() => {
          setShowMatch(false);
          setMatchedUser(null);
          setMatchedMatchId(null);
        }}
      />

      {tutorial ? (
        <TutorialOverlay
          title={tutorial.title}
          body={tutorial.body}
          stepIndex={tutorialStep}
          totalSteps={tutorialSteps.length}
          placement={tutorialPlacement}
          targetRect={tutorialTargetRect}
          onPress={advanceTutorial}
        />
      ) : null}
    </View>
  );
}
