// Reuse the existing full profile screen, but mount it inside the Likes tab stack.
// This keeps the bottom tab bar visible so users don't feel like the Likes tab "disappeared".
import { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import OtherUserProfileScreen from "../../../profile/[userId].jsx";
import { useSubscription } from "@/utils/subscription";
import { BG_GRADIENT, CTA_GRADIENT } from "@/utils/likesConstants";

export default function LikesProfileWrapper(props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isCommitted, refresh: refreshSubscription } = useSubscription();

  // If the user just purchased and came back here, ensure we re-check.
  useEffect(() => {
    refreshSubscription?.().catch(() => null);
  }, [refreshSubscription]);

  if (isCommitted) {
    return <OtherUserProfileScreen {...props} />;
  }

  const onUpgrade = () => {
    const qs = new URLSearchParams({
      returnTo: "/likes",
      intent: "likes_locked",
      tier: "committed",
    });
    router.replace(`/subscription?${qs.toString()}`);
  };

  return (
    <LinearGradient
      colors={BG_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>
          Become Committed to view likes
        </Text>
        <Text style={{ marginTop: 10, fontSize: 14, color: "#374151" }}>
          To protect privacy, you can only open a liker’s full profile after you
          unlock Likes.
        </Text>

        <TouchableOpacity
          onPress={onUpgrade}
          activeOpacity={0.9}
          style={{
            marginTop: 18,
            backgroundColor: CTA_GRADIENT[1],
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Unlock Likes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{ marginTop: 10, paddingVertical: 10, alignItems: "center" }}
        >
          <Text style={{ color: "#6B7280", fontWeight: "800" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
