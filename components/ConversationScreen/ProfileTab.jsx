import { useMemo } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSubscription } from "@/utils/subscription";
import { ProfilePreviewContent } from "@/components/ProfilePreview/ProfilePreviewContent";

export function ProfileTab({
  matchInfo,
  insets,
  chatLockState = "unlocked", // 'unlocked' | 'locked' | 'unknown'
  onPressMoveToChat,
  moveToChatBusy = false,
}) {
  const { isCommitted, loading: subscriptionLoading } = useSubscription();

  const otherUserId = useMemo(() => {
    const raw = matchInfo?.otherUser?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [matchInfo?.otherUser?.id]);

  const {
    data: otherProfile,
    isLoading: otherProfileLoading,
    error: otherProfileError,
    refetch: refetchOtherProfile,
  } = useQuery({
    queryKey: ["profile", "user", otherUserId],
    enabled: Number.isFinite(otherUserId),
    queryFn: async () => {
      const response = await fetch(`/api/profile/me?userId=${otherUserId}`);
      if (!response.ok) {
        throw new Error(
          `When fetching /api/profile/me, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const json = await response.json();
      return json?.profile || null;
    },
  });

  const otherPreferences = useMemo(() => {
    const raw = otherProfile?.preferences;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }, [otherProfile?.preferences]);

  // NOTE:
  // Per product rules, viewing a match's profile should feel clean and unpressured.
  // The "Move to chat" action lives on the Chat tab (where the typing box is replaced).
  // So we intentionally do NOT show a sticky "Move to chat" overlay on the Profile tab.
  void chatLockState;
  void onPressMoveToChat;
  void moveToChatBusy;

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0B10" }}>
      {otherProfileLoading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="#FF1744" />
        </View>
      ) : otherProfileError ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 18,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
            Could not load profile
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
            {otherProfileError?.message || "Please try again."}
          </Text>
          <TouchableOpacity
            onPress={() => refetchOtherProfile()}
            style={{
              marginTop: 16,
              backgroundColor: "#FF1744",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : otherProfile ? (
        <View style={{ flex: 1 }}>
          <ProfilePreviewContent
            profile={otherProfile}
            preferences={otherPreferences}
            bottomInset={insets.bottom}
            showDatingInsights={!subscriptionLoading && isCommitted}
          />
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 18,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
            No profile yet
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
            This user hasn't set up their dating profile.
          </Text>
        </View>
      )}
    </View>
  );
}
