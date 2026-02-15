import { View, Text, TouchableOpacity } from "react-native";
import { Heart } from "lucide-react-native";

export function LikePill({ message, isMe, onToggleLike }) {
  const count = Math.max(0, Number(message?.like_count || 0));
  const liked = Boolean(message?.liked_by_me);

  if (!liked && count <= 0) return null;

  const color = liked ? "#FF1744" : "#6B7280";
  const label = count > 0 ? String(count) : "";

  return (
    <TouchableOpacity
      onPress={() => onToggleLike?.(message)}
      activeOpacity={0.85}
      style={{
        marginTop: 6,
        alignSelf: isMe ? "flex-end" : "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.75)",
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
      }}
    >
      <Heart size={14} color={color} />
      {label ? (
        <Text style={{ fontSize: 12, fontWeight: "900", color }}>{label}</Text>
      ) : null}
    </TouchableOpacity>
  );
}
