import { View, Text, Animated } from "react-native";
import { ProfilePreviewContent } from "@/components/ProfilePreview/ProfilePreviewContent";

export function ProfileCard({
  profile,
  position,
  rotate,
  likeOpacity,
  nopeOpacity,
  panHandlers,
}) {
  const preferences =
    profile?.preferences && typeof profile.preferences === "object"
      ? profile.preferences
      : {};

  const previewKey = profile?.id
    ? `profile-preview-${profile.id}`
    : "profile-preview";

  return (
    <Animated.View
      {...panHandlers}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate },
        ],
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          borderRadius: 20,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        }}
      >
        {/* Full scroll profile (like dating apps) */}
        <ProfilePreviewContent
          key={previewKey}
          profile={profile}
          preferences={preferences}
        />

        {/* LIKE Label */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            opacity: likeOpacity,
            transform: [{ rotate: "-20deg" }],
          }}
        >
          <View
            style={{
              borderWidth: 4,
              borderColor: "#4CAF50",
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: "800", color: "#4CAF50" }}>
              LIKE
            </Text>
          </View>
        </Animated.View>

        {/* NOPE Label */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 50,
            right: 20,
            opacity: nopeOpacity,
            transform: [{ rotate: "20deg" }],
          }}
        >
          <View
            style={{
              borderWidth: 4,
              borderColor: "#FF1744",
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: "800", color: "#FF1744" }}>
              NOPE
            </Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
