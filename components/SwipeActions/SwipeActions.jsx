import { View, TouchableOpacity } from "react-native";
import { Heart, X } from "lucide-react-native";

export function SwipeActions({ onSwipeLeft, onSwipeRight, bottomInset }) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: bottomInset + 80,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <TouchableOpacity
        onPress={onSwipeLeft}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }}
      >
        <X size={32} color="#FF1744" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSwipeRight}
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          // Match screenshot: yellow heart CTA
          backgroundColor: "#FFD84D",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
        }}
      >
        <Heart size={36} color="#111827" fill="#111827" />
      </TouchableOpacity>
    </View>
  );
}
