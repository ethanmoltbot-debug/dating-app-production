import { View, Text } from "react-native";
import { Heart } from "lucide-react-native";

export function ReactionBubble({ message, isMe }) {
  // Tinder-style: only show the reaction heart on *your* messages when the other person liked them.
  const count = Math.max(0, Number(message?.like_count || 0));
  if (!isMe) return null;
  if (count <= 0) return null;

  // If there are two participants, and you can't like your own message,
  // `count > 0` effectively means "liked by the other person".
  const showCount = count > 1;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: -12,
        top: "50%",
        transform: [{ translateY: -10 }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderRadius: 999,
          paddingHorizontal: 7,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
        }}
      >
        <Heart size={12} color="#FF1744" fill="#FF1744" />
        {showCount ? (
          <Text style={{ fontSize: 11, fontWeight: "900", color: "#111" }}>
            {String(count)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
