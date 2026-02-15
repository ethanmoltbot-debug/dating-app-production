import { TouchableOpacity } from "react-native";
import { Heart } from "lucide-react-native";

export function MessageLikeButton({ message, onToggleLike }) {
  if (!message || typeof onToggleLike !== "function") return null;

  const liked = Boolean(message?.liked_by_me);
  const color = liked ? "#FF1744" : "rgba(60,60,67,0.35)";
  const fill = liked ? "#FF1744" : "transparent";

  return (
    <TouchableOpacity
      onPress={() => onToggleLike(message)}
      activeOpacity={0.75}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: "auto",
        backgroundColor: "transparent",
      }}
      accessibilityRole="button"
      accessibilityLabel={liked ? "Unlike message" : "Like message"}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Heart size={22} color={color} fill={fill} />
    </TouchableOpacity>
  );
}
