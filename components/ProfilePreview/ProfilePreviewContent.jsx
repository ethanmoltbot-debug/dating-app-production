import { useMemo, useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react-native";
import { formatDistanceMiles } from "@/utils/profileFormatters";
import { THEME } from "./theme";
import { useProfileData } from "@/hooks/useProfileData";
import { useBasicsItems } from "@/hooks/useBasicsItems";
import { useVoicePromptPlayer } from "@/hooks/useVoicePromptPlayer";
import { useDatingInsights } from "@/hooks/useDatingInsights";
import { useProfileSections } from "@/hooks/useProfileSections";
import { useSectionActionMeta } from "@/hooks/useSectionActionMeta";
import { useSectionRenderer } from "@/hooks/useSectionRenderer";
import useUser from "@/utils/auth/useUser";
import ProfileMenuModal from "@/components/ProfilePreview/ProfileMenuModal";
import { ReportModal } from "@/components/ConversationScreen/ReportModal";
import PhotoViewerModal from "@/components/ProfilePreview/PhotoViewerModal";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function ProfilePreviewContent({
  profile,
  preferences,
  bottomInset = 0,
  screenBackgroundColor,
  showSectionActions = false,
  onLikeSection,
  showDatingInsights = false,
  onBlocked,
  viewerUserId, // optional: the signed-in user id (from AsyncStorage, params, etc)
  tutorialHeroLikeRef, // NEW: optional ref for tutorial arrow to the hero like button
  tutorialHeroPhotoRef, // NEW: optional ref for tutorial arrow to the hero photo
  heroTopLeftBadgeText, // NEW: optional badge to show on the first (hero) photo
}) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: authedUser } = useUser();

  const [storageUserId, setStorageUserId] = useState(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("user")
      .then((raw) => {
        if (!mounted) return;
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          const n = Number(parsed?.id);
          if (Number.isFinite(n)) {
            setStorageUserId(n);
          }
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // ignore
      });

    return () => {
      mounted = false;
    };
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("HARASSMENT");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSending, setReportSending] = useState(false);

  const targetUserId = useMemo(() => {
    const raw = profile?.user_id ?? profile?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [profile?.id, profile?.user_id]);

  const viewerId = useMemo(() => {
    const fromProp = Number(viewerUserId);
    if (Number.isFinite(fromProp)) return fromProp;

    const fromAuth = Number(authedUser?.id);
    if (Number.isFinite(fromAuth)) return fromAuth;

    const fromStorage = Number(storageUserId);
    if (Number.isFinite(fromStorage)) return fromStorage;

    return null;
  }, [authedUser?.id, storageUserId, viewerUserId]);

  const screenBg =
    typeof screenBackgroundColor === "string"
      ? screenBackgroundColor
      : THEME.screenBg;

  const { photos, videos, interests, prompts, voicePrompt } = useProfileData(
    profile,
    preferences,
  );

  // Full-screen photo viewer state
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  const photoItems = useMemo(() => {
    const arr = Array.isArray(photos) ? photos : [];
    return arr
      .map((uri, idx) => ({ uri, idx }))
      .filter((x) => typeof x.uri === "string" && x.uri.length > 0);
  }, [photos]);

  const photoUris = useMemo(() => {
    return photoItems.map((x) => x.uri);
  }, [photoItems]);

  const openPhotoAtIndex = useCallback(
    (originalPhotoIndex) => {
      if (!Array.isArray(photoItems) || photoItems.length === 0) {
        return;
      }

      const target = Number(originalPhotoIndex);
      const pos = photoItems.findIndex((x) => x.idx === target);
      const nextIndex = pos >= 0 ? pos : 0;

      setPhotoViewerIndex(nextIndex);
      setPhotoViewerOpen(true);
    },
    [photoItems],
  );

  const closePhotoViewer = useCallback(() => {
    setPhotoViewerOpen(false);
  }, []);

  const {
    shouldFetchInsights,
    insightsQuery,
    dateHistoryLine,
    followThroughLine,
  } = useDatingInsights(profile, showDatingInsights);

  const titleName = profile?.display_name || "Your profile";
  const ageText = profile?.age ? String(profile.age) : "";
  const locationText = profile?.location || "";

  const distanceLabel = useMemo(() => {
    return formatDistanceMiles(profile?.distance_miles);
  }, [profile?.distance_miles]);

  const topSubtitle = useMemo(() => {
    if (ageText) {
      return `${titleName}, ${ageText}`;
    }
    return titleName;
  }, [ageText, titleName]);

  const basicsItems = useBasicsItems(
    profile,
    preferences,
    locationText,
    distanceLabel,
  );

  const voicePromptAudioUrl = voicePrompt.audioUrl;

  const { voicePromptPlaying, onToggleVoicePrompt } =
    useVoicePromptPlayer(voicePromptAudioUrl);

  const sections = useProfileSections(
    photos,
    prompts,
    videos,
    interests,
    voicePrompt,
    showDatingInsights,
    profile?.bio || "",
  );

  const getSectionActionMeta = useSectionActionMeta(
    titleName,
    profile,
    locationText,
    basicsItems,
    interests,
    voicePrompt,
  );

  const shouldShowActions =
    !!showSectionActions && typeof onLikeSection === "function";

  const renderSectionActions = useCallback(
    (meta) => {
      if (!shouldShowActions) {
        return null;
      }

      const heartBg = "#FFD84D";
      const heartFg = "#111827";

      const isHeroPhotoLike = meta?.key === "photo:hero";
      const maybeRef = isHeroPhotoLike ? tutorialHeroLikeRef : null;

      return (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: 14,
            bottom: 14,
          }}
        >
          <TouchableOpacity
            ref={maybeRef}
            onPress={() => onLikeSection(meta)}
            activeOpacity={0.85}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: heartBg,
              borderWidth: 1,
              borderColor: "rgba(17,24,39,0.14)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
            }}
            accessibilityRole="button"
            accessibilityLabel="Like this section"
          >
            <Heart size={22} color={heartFg} fill={heartFg} />
          </TouchableOpacity>
        </View>
      );
    },
    [onLikeSection, shouldShowActions, tutorialHeroLikeRef],
  );

  const openProfileMenu = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const canShowMenu = useMemo(() => {
    if (!targetUserId) {
      return false;
    }

    // If we don't know who the viewer is yet, don't show report/block.
    if (!viewerId) {
      return false;
    }

    // Hide menu on your own profile (important for /profile/preview).
    if (Number(viewerId) === Number(targetUserId)) {
      return false;
    }

    return true;
  }, [targetUserId, viewerId]);

  const blockThisUser = useCallback(async () => {
    if (!viewerId) {
      Alert.alert("Sign in required", "Please sign in to block someone.");
      return;
    }

    if (!targetUserId) {
      Alert.alert("Block failed", "Could not find this user.");
      return;
    }

    Alert.alert(
      "Block this user?",
      "They won't be able to match or message you again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const resp = await fetch("/api/profiles/block", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  blockerUserId: viewerId,
                  blockedUserId: targetUserId,
                }),
              });

              if (!resp.ok) {
                const text = await resp.text();
                throw new Error(
                  `When posting /api/profiles/block, the response was [${resp.status}] ${resp.statusText}. ${text}`,
                );
              }

              // Nudge any cached feeds / lists to refresh.
              queryClient.invalidateQueries({ queryKey: ["profileFeed"] });
              queryClient.invalidateQueries({ queryKey: ["matchesSummary"] });
              queryClient.invalidateQueries({ queryKey: ["likesMe"] });

              Alert.alert("Blocked", "Done.");
              onBlocked?.();
            } catch (e) {
              console.error("Could not block user", e);
              Alert.alert("Block failed", "Could not block right now.");
            }
          },
        },
      ],
    );
  }, [onBlocked, queryClient, targetUserId, viewerId]);

  const submitReport = useCallback(async () => {
    if (!viewerId) {
      Alert.alert("Sign in required", "Please sign in to report someone.");
      return;
    }

    if (!targetUserId) {
      Alert.alert("Report failed", "Could not find this user.");
      return;
    }

    const description = reportDesc.trim();
    if (!description) {
      Alert.alert("Add details", "Please add a short description.");
      return;
    }

    try {
      setReportSending(true);
      const resp = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterUserId: viewerId,
          reportedUserId: targetUserId,
          reportType,
          description,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/reports, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }

      setReportOpen(false);
      setReportDesc("");
      Alert.alert("Report sent", "Thanks — our team will review it.");
    } catch (e) {
      console.error("Could not report user", e);
      Alert.alert("Report failed", "Could not send your report right now.");
    } finally {
      setReportSending(false);
    }
  }, [reportDesc, reportType, targetUserId, viewerId]);

  const safeHeroBadgeText = useMemo(() => {
    const t =
      typeof heroTopLeftBadgeText === "string"
        ? heroTopLeftBadgeText.trim()
        : "";
    return t;
  }, [heroTopLeftBadgeText]);

  const getPhotoBadge = useCallback(
    (isHero) => {
      // Only show a badge on the first photo when requested (e.g. Passport mode).
      if (isHero && safeHeroBadgeText) {
        return safeHeroBadgeText;
      }

      // Otherwise hide the top-left counter badge on profiles.
      return "";
    },
    [safeHeroBadgeText],
  );

  const getVideoBadge = useCallback(() => {
    // Hide the top-left counter badge on profiles.
    return "";
  }, []);

  const renderSection = useSectionRenderer({
    profile,
    titleName,
    topSubtitle,
    locationText,
    basicsItems,
    interests,
    voicePrompt,
    voicePromptPlaying,
    onToggleVoicePrompt,
    shouldFetchInsights,
    insightsQuery,
    dateHistoryLine,
    followThroughLine,
    photos,
    videos,
    getSectionActionMeta,
    shouldShowActions,
    renderSectionActions,
    getPhotoBadge,
    getVideoBadge,
    onOpenProfileMenu: canShowMenu ? openProfileMenu : null,
    onOpenPhotoAtIndex: openPhotoAtIndex,
    tutorialHeroPhotoRef,
  });

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: screenBg }}
        contentContainerStyle={{ paddingBottom: bottomInset + 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
          {sections.map((s, idx) => {
            const key = `${s.type}-${idx}`;
            const body = renderSection(s);
            return <View key={key}>{body}</View>;
          })}
        </View>
      </ScrollView>

      <PhotoViewerModal
        visible={photoViewerOpen}
        uris={photoUris}
        initialIndex={photoViewerIndex}
        onClose={closePhotoViewer}
      />

      <ProfileMenuModal
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onPressReport={() => setReportOpen(true)}
        onPressBlock={blockThisUser}
        insets={insets}
      />

      <ReportModal
        reportOpen={reportOpen}
        setReportOpen={setReportOpen}
        reportType={reportType}
        setReportType={setReportType}
        reportDesc={reportDesc}
        setReportDesc={setReportDesc}
        reportSending={reportSending}
        submitReport={submitReport}
        insets={insets}
      />
    </>
  );
}
