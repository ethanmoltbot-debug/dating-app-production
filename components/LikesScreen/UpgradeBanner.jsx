import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

export function UpgradeBanner({ onUpgrade }) {
  return (
    <View
      style={{
        marginBottom: 14,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.92)",
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
        See your first like — unlock the rest.
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 13,
          color: "#6B7280",
          lineHeight: 18,
        }}
      >
        You can match with the first person for free. To see everyone else who
        likes you, become Committed.
      </Text>

      <TouchableOpacity
        onPress={onUpgrade}
        activeOpacity={0.9}
        style={{ marginTop: 12, borderRadius: 14, overflow: "hidden" }}
      >
        <LinearGradient
          colors={CTA_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            Become Committed
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
