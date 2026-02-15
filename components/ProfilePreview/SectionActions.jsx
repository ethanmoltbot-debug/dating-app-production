import { View, TouchableOpacity } from "react-native";
import { Heart } from "lucide-react-native";

export function SectionActions({ onPress }) {
  const heartBg = "#FFD84D";
  const heartFg = "#111827";

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
        onPress={onPress}
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
}
