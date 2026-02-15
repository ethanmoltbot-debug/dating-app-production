import { View, Text } from "react-native";
import { Sparkles } from "lucide-react-native";

const ACCENT = "#7C3AED";

export function TipCard() {
  return (
    <View
      style={{
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 10,
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#E5E5EA",
          padding: 14,
          flexDirection: "row",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <Sparkles size={18} color={ACCENT} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "600", color: "#111" }}>Tip</Text>
          <Text
            style={{
              marginTop: 6,
              color: "#6B7280",
              lineHeight: 18,
            }}
          >
            A clear bio + 3 prompts usually gets better messages than just
            photos.
          </Text>
        </View>
      </View>
    </View>
  );
}
