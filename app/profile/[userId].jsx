import { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/utils/auth/useAuth";
import { MatchModal } from "@/components/MatchModal/MatchModal";
import { useSubscription } from "@/utils/subscription";
import { ProfilePreviewContent } from "@/components/ProfilePreview/ProfilePreviewContent";

const ACCENT = "#FF1744";
const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

export default function OtherUserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signIn } = useAuth();
  const { userId, fromLikes } = useLocalSearchParams();

  const [showMatch, setShowMatch] = useState(false);
  const [matchedMatchId, setMatchedMatchId] = useState(null);

  const { isCommitted, loading: subscriptionLoading } = useSubscription();

  const numericUserId = useMemo(() => {
    const raw = Array.isArray(userId) ? userId[0] : userId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [userId]);

  const cameFromLikes = useMemo(() => {
    const raw = Array.isArray(fromLikes) ? fromLikes[0] : fromLikes;
    if (raw == null) return false;
    const s = String(raw).toLowerCase();
    return s === "1" || s === "true" || s === "yes";
  }, [fromLikes]);

  // Load current viewer so we can "Like back" from the profile screen.
  const viewerQuery = useQuery({
    queryKey: ["storedUser"],
    queryFn: async () => {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
        return null;
      }
    },
  });

  const viewerId = viewerQuery.data?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["profile", "user", numericUserId],
    enabled: Number.isFinite(numericUserId),
    queryFn: async () => {
      const response = await fetch(`/api/profile/me?userId=${numericUserId}`);
      if (!response.ok) {
        throw new Error(
          `When fetching /api/profile/me, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const json = await response.json();
      return json?.profile || null;
    },
  });

  const profile = data;

  const preferences = useMemo(() => {
    const raw = profile?.preferences;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }, [profile?.preferences]);

  const title = useMemo(() => {
    const name = profile?.display_name;
    if (name && typeof name === "string") {
      return name;
    }
    return "Profile";
  }, [profile?.display_name]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const likeBackMutation = useMutation({
    mutationFn: async () => {
      const fromUserId = Number(viewerId);
      const toUserId = Number(numericUserId);

      if (!Number.isFinite(fromUserId) || !Number.isFinite(toUserId)) {
        throw new Error("Missing user ids");
      }

      const resp = await fetch("/api/profiles/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId, toUserId }),
      });

      if (!resp.ok) {
        throw new Error(
          `When fetching /api/profiles/like, the response was [${resp.status}] ${resp.statusText}`,
        );
      }

      return resp.json();
    },
    onSuccess: (data) => {
      // Keep Likes + Matches in sync if the user came from Likes.
      queryClient.invalidateQueries({ queryKey: ["likesMe"] });
      if (viewerId) {
        queryClient.invalidateQueries({
          queryKey: ["matchesSummary", viewerId],
        });
        queryClient.invalidateQueries({ queryKey: ["matches", viewerId] });
      }

      if (data?.isMatch) {
        setMatchedMatchId(data?.matchId || null);
        setShowMatch(true);
      } else if (cameFromLikes) {
        // If they liked back from the Likes inbox and it didn't instantly match,
        // popping back feels natural.
        router.back();
      }
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const canLike = useMemo(() => {
    const fromUserId = Number(viewerId);
    const toUserId = Number(numericUserId);
    if (!Number.isFinite(fromUserId) || !Number.isFinite(toUserId))
      return false;
    if (fromUserId === toUserId) return false;
    return true;
  }, [numericUserId, viewerId]);

  const primaryCtaLabel = useMemo(() => {
    if (!viewerId) return "Sign in to like";
    return cameFromLikes ? "Like back" : "Like";
  }, [cameFromLikes, viewerId]);

  if (!Number.isFinite(numericUserId)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: insets.top,
          paddingHorizontal: 18,
          justifyContent: "center",
        }}
      >
        <StatusBar style="dark" />
        <Text style={{ color: "#111", fontSize: 18, fontWeight: "600" }}>
          Could not open profile
        </Text>
        <Text style={{ color: "#6B7280", marginTop: 8 }}>Missing user id.</Text>
        <TouchableOpacity
          onPress={onBack}
          style={{
            marginTop: 16,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E5E5EA",
          }}
        >
          <Text style={{ color: "#111", fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: insets.top,
        }}
      >
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error) {
    const errorMsg = error?.message || "Please try again.";

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: insets.top,
          paddingHorizontal: 18,
          justifyContent: "center",
        }}
      >
        <StatusBar style="dark" />
        <Text style={{ color: "#111", fontSize: 18, fontWeight: "600" }}>
          Could not load profile
        </Text>
        <Text style={{ color: "#6B7280", marginTop: 8 }}>{errorMsg}</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{
            marginTop: 16,
            backgroundColor: ACCENT,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onBack}
          style={{
            marginTop: 10,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E5E5EA",
          }}
        >
          <Text style={{ color: "#111", fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: insets.top,
          paddingHorizontal: 18,
          justifyContent: "center",
        }}
      >
        <StatusBar style="dark" />
        <Text style={{ color: "#111", fontSize: 18, fontWeight: "600" }}>
          No profile yet
        </Text>
        <Text style={{ color: "#6B7280", marginTop: 8 }}>
          This user hasn’t set up their dating profile.
        </Text>
        <TouchableOpacity
          onPress={onBack}
          style={{
            marginTop: 16,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E5E5EA",
          }}
        >
          <Text style={{ color: "#111", fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Remove misleading "cameFromLikes || true" and just always show the bottom CTA for now.
  const showCta = true;

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0B10" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: "#0B0B10",
          borderBottomWidth: 1,
          borderBottomColor: "#242733",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#fff",
            flex: 1,
            textAlign: "center",
            marginHorizontal: 12,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={{ width: 40, height: 40 }} />
      </View>

      <ProfilePreviewContent
        profile={profile}
        preferences={preferences}
        bottomInset={insets.bottom + (showCta ? 84 : 0)}
        showDatingInsights={!subscriptionLoading && isCommitted}
      />

      {showCta ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 14,
            paddingTop: 10,
            backgroundColor: "rgba(11, 11, 16, 0.88)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.10)",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (!viewerId) {
                signIn();
                return;
              }
              if (!canLike) return;
              likeBackMutation.mutate();
            }}
            disabled={
              likeBackMutation.isPending || (!viewerId ? false : !canLike)
            }
            activeOpacity={0.9}
            style={{ borderRadius: 999, overflow: "hidden" }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <Heart size={18} color="#fff" style={{ marginRight: 10 }} />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
                {likeBackMutation.isPending ? "Liking…" : primaryCtaLabel}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text
            style={{
              marginTop: 10,
              textAlign: "center",
              color: "rgba(255,255,255,0.70)",
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {cameFromLikes
              ? "Review their profile first — then decide."
              : "Like them to create a match if they like you too."}
          </Text>
        </View>
      ) : null}

      <MatchModal
        visible={showMatch}
        matchedUser={profile}
        matchId={matchedMatchId}
        currentUserId={viewerId}
        onClose={() => {
          setShowMatch(false);
          setMatchedMatchId(null);
        }}
      />
    </View>
  );
}
