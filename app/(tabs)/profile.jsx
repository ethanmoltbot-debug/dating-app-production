import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import {
  Settings,
  LogOut,
  User,
  MapPin,
  Mail,
  ChevronRight,
  Eye,
  Edit3,
  Award,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSubscription } from "@/utils/subscription";
import { useQuery } from "@tanstack/react-query";
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const { isPro, isAdminOverride, tier } = useSubscription();

  const BG_GRADIENT = useMemo(() => ["#F7EEFF", "#F2F7FF", "#FFF1F7"], []);
  const CTA_GRADIENT = useMemo(() => ["#FF4FD8", "#7C3AED"], []);
  const accent = "#A855F7";

  const loadProfile = useCallback(async (userId) => {
    try {
      const response = await fetch(`/api/profile/me?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to load profile");
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }, []);

  const loadUserAndProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await loadProfile(parsedUser.id);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    loadUserAndProfile();
  }, [loadUserAndProfile]);

  // Refresh whenever the tab is focused (so edits show immediately after saving)
  useFocusEffect(
    useCallback(() => {
      loadUserAndProfile();
    }, [loadUserAndProfile]),
  );

  const handleSignOut = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/auth/login");
  };

  // Rename helper to avoid Wifey+ wording (keep route the same)
  const openMembership = () => {
    const returnTo = encodeURIComponent("/profile");
    router.push(`/subscription?returnTo=${returnTo}`);
  };

  const openEditProfile = useCallback(() => {
    router.push("/profile/edit");
  }, [router]);

  const openPreviewProfile = useCallback(() => {
    router.push("/profile/preview");
  }, [router]);

  const openSettings = useCallback(() => {
    router.push("/profile/settings");
  }, [router]);

  const openRank = useCallback(() => {
    router.push("/profile/rank");
  }, [router]);

  const openDateCredits = useCallback(() => {
    try {
      const returnTo = encodeURIComponent("/profile");
      router.push(`/date-credits?returnTo=${returnTo}`);
    } catch (e) {
      console.error(e);
      router.push("/date-credits");
    }
  }, [router]);

  const displayName = useMemo(() => {
    const nameFromProfile = profile?.display_name;
    if (nameFromProfile) return nameFromProfile;

    const email = user?.email;
    if (email && typeof email === "string") {
      const at = email.indexOf("@");
      if (at > 0) return email.slice(0, at);
      return email;
    }

    return "Your profile";
  }, [profile?.display_name, user?.email]);

  const displayAge = profile?.age ? String(profile.age) : null;

  const audienceGender = useMemo(() => {
    const g = String(profile?.gender || "")
      .toLowerCase()
      .trim();
    if (g.includes("male")) return "MALE";
    if (g.includes("female")) return "FEMALE";
    return "FEMALE";
  }, [profile?.gender]);

  const rankQuery = useQuery({
    queryKey: ["quizRank", user?.id, audienceGender],
    enabled: Number.isFinite(Number(user?.id)),
    queryFn: async () => {
      const userId = Number(user?.id);
      const resp = await fetch(
        `/api/quiz/rank?userId=${userId}&gender=${audienceGender}`,
      );
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/quiz/rank, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      return resp.json();
    },
    staleTime: 30_000,
  });

  const rankLine = useMemo(() => {
    const r = rankQuery.data?.rank;
    const t = rankQuery.data?.totalCount;

    if (!Number.isFinite(r) || !Number.isFinite(t)) {
      return null;
    }

    try {
      return `${r} / ${new Intl.NumberFormat("en-US").format(t)}`;
    } catch {
      return `${r} / ${t}`;
    }
  }, [rankQuery.data?.rank, rankQuery.data?.totalCount]);

  const dateCreditsQuery = useQuery({
    queryKey: ["dateCreditsStatus", user?.id],
    enabled: Number.isFinite(Number(user?.id)),
    queryFn: async () => {
      const userId = Number(user?.id);
      const resp = await fetch(`/api/date-credits/status?userId=${userId}`);
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/date-credits/status, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      return resp.json();
    },
    staleTime: 15_000,
  });

  const dateCreditsLine = useMemo(() => {
    if (dateCreditsQuery.isLoading) {
      return "Loading…";
    }

    if (dateCreditsQuery.isError) {
      return "Tap to retry";
    }

    const credits = Number(dateCreditsQuery.data?.credits || 0);
    const maxCredits = Number(dateCreditsQuery.data?.maxCredits || 3);

    return `${credits}/${maxCredits} available`;
  }, [
    dateCreditsQuery.data?.credits,
    dateCreditsQuery.data?.maxCredits,
    dateCreditsQuery.isError,
    dateCreditsQuery.isLoading,
  ]);

  // Refresh credits when coming back to this tab (after checkout, etc)
  useFocusEffect(
    useCallback(() => {
      if (Number.isFinite(Number(user?.id))) {
        dateCreditsQuery.refetch();
      }
    }, [dateCreditsQuery.refetch, user?.id]),
  );

  const membershipSubtitle = useMemo(() => {
    if (!isPro) {
      return "See Serious and Committed";
    }

    if (isAdminOverride) {
      const tierLabel = tier === "committed" ? "Committed" : "Serious";
      return `Granted by admin • ${tierLabel}`;
    }

    return "Manage your plan";
  }, [isAdminOverride, isPro, tier]);

  // Tutorial (show once)
  const [tutorialStep, setTutorialStep] = useState(-1);
  const [tutorialTargetRect, setTutorialTargetRect] = useState(null);
  const previewBtnRef = useRef(null);
  const editBtnRef = useRef(null);

  const tutorialSteps = useMemo(() => {
    return [
      {
        title: "Edit",
        body: "Make your profile stand out. Add good photos and fill in your details.",
        placement: { type: "bottom" },
        targetKey: "edit",
      },
      {
        title: "Preview",
        body: "Want to see how you look to others? Preview your dating profile here.",
        placement: { type: "bottom" },
        targetKey: "preview",
      },
    ];
  }, []);

  const tutorialKey = useMemo(() => {
    return "wifey:tutorial:v1:profile";
  }, []);

  const maybeShowTutorial = useCallback(async () => {
    try {
      if (!user?.id) return;
      if (user?.status !== "APPROVED") return;

      const seen = await AsyncStorage.getItem(tutorialKey);
      if (!seen) {
        setTutorialStep(0);
      }
    } catch (e) {
      console.error(e);
    }
  }, [tutorialKey, user?.id, user?.status]);

  useEffect(() => {
    maybeShowTutorial();
  }, [maybeShowTutorial]);

  // NEW: re-check on tab focus so a "reset tips" action can take effect without restarting the app.
  useFocusEffect(
    useCallback(() => {
      maybeShowTutorial();
    }, [maybeShowTutorial]),
  );

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

  const tutorial = tutorialStep >= 0 ? tutorialSteps[tutorialStep] : null;

  const tutorialPlacement = useMemo(() => {
    if (!tutorial) return null;
    return { type: "bottom", inset: insets.bottom + 140 };
  }, [insets.bottom, tutorial]);

  useEffect(() => {
    let cancelled = false;

    const targetKey = tutorial?.targetKey;
    const targetRef =
      targetKey === "preview"
        ? previewBtnRef
        : targetKey === "edit"
          ? editBtnRef
          : null;

    if (!targetRef?.current) {
      setTutorialTargetRect(null);
      return;
    }

    const measure = () => {
      try {
        const node = targetRef.current;
        if (!node || typeof node.measureInWindow !== "function") {
          return;
        }

        node.measureInWindow((x, y, width, height) => {
          if (cancelled) return;
          if (![x, y, width, height].every(Number.isFinite)) return;
          setTutorialTargetRect({ x, y, width, height });
        });
      } catch (e) {
        console.error(e);
      }
    };

    const t = setTimeout(measure, 60);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [tutorial?.targetKey]);

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={BG_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SoftBlobsBackground />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.84)",
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: "900", color: "#111" }}>
            Profile
          </Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: "#6B7280" }}>
            Manage your photos and settings
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {/* Profile Header */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 22,
            padding: 18,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
          }}
        >
          {/* Profile photo is tappable to edit */}
          <TouchableOpacity
            onPress={openEditProfile}
            activeOpacity={0.85}
            style={{ marginBottom: 16 }}
          >
            {profile?.photos?.[0] ? (
              <Image
                source={{ uri: profile.photos[0] }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                }}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "rgba(17,17,17,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={48} color="#999" />
              </View>
            )}
          </TouchableOpacity>

          {/* Name (always visible) */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#2D2D2D",
              marginBottom: 4,
            }}
          >
            {displayName}
            {displayAge ? `, ${displayAge}` : ""}
          </Text>

          {/* Membership card (always visible) */}
          <TouchableOpacity
            onPress={openMembership}
            activeOpacity={0.85}
            style={{
              width: "100%",
              marginTop: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
              backgroundColor: "rgba(255,255,255,0.92)",
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Use a clear ring glyph instead of the Circle+Gem combo */}
                  <Text style={{ fontSize: 18, lineHeight: 22, color: "#fff" }}>
                    💍
                  </Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: "#111" }}
                >
                  {isPro ? "Membership" : "Upgrade"}
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                  {membershipSubtitle}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Standard Rank card */}
          <TouchableOpacity
            onPress={openRank}
            activeOpacity={0.85}
            style={{
              width: "100%",
              marginTop: 10,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
              backgroundColor: "rgba(255,255,255,0.92)",
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(17,17,17,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.06)",
                }}
              >
                <Award size={18} color="#6B7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: "#111" }}
                >
                  Standard Rank
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                  {rankQuery.isLoading
                    ? "Loading…"
                    : rankQuery.data?.isApproved === true && rankLine
                      ? `${rankLine}  •  and growing`
                      : "Tap to view"}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Date credits */}
          <TouchableOpacity
            onPress={() => {
              if (dateCreditsQuery.isError) {
                dateCreditsQuery.refetch();
                return;
              }
              openDateCredits();
            }}
            activeOpacity={0.85}
            style={{
              width: "100%",
              marginTop: 10,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
              backgroundColor: "rgba(255,255,255,0.92)",
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, lineHeight: 20, color: "#fff" }}>
                    🎟️
                  </Text>
                </LinearGradient>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: "#111" }}
                >
                  Date credits
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                  {dateCreditsLine}
                </Text>
              </View>
            </View>

            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Profile details */}
          {profile?.location ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <MapPin size={16} color="#666" />
              <Text style={{ fontSize: 14, color: "#666", marginLeft: 6 }}>
                {profile.location}
              </Text>
            </View>
          ) : null}

          {!profile ? (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "400",
                color: "#6B7280",
                marginTop: 12,
              }}
            >
              Finish setting up your profile to get better matches.
            </Text>
          ) : null}
        </View>

        {/* Account Info */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            overflow: "hidden",
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", padding: 16 }}
          >
            <Mail size={20} color="#6B7280" />
            <Text
              style={{
                fontSize: 15,
                color: "#111",
                marginLeft: 12,
                fontWeight: "700",
              }}
            >
              {profile?.email || user?.email}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            ref={previewBtnRef}
            onPress={openPreviewProfile}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(17,17,17,0.06)",
            }}
          >
            <Eye size={20} color="#6B7280" />
            <Text
              style={{
                fontSize: 16,
                color: "#111",
                marginLeft: 12,
                fontWeight: "700",
              }}
            >
              Preview Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openSettings}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(17,17,17,0.06)",
            }}
          >
            <Settings size={20} color="#6B7280" />
            <Text
              style={{
                fontSize: 16,
                color: "#111",
                marginLeft: 12,
                fontWeight: "700",
              }}
            >
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            ref={editBtnRef}
            onPress={openEditProfile}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(17,17,17,0.06)",
            }}
          >
            <Edit3 size={20} color="#6B7280" />
            <Text
              style={{
                fontSize: 16,
                color: "#111",
                marginLeft: 12,
                fontWeight: "700",
              }}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
            }}
          >
            <LogOut size={20} color="#FF4FD8" />
            <Text
              style={{
                fontSize: 16,
                color: "#FF4FD8",
                marginLeft: 12,
                fontWeight: "800",
              }}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
