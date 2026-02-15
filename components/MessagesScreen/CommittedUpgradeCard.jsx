import { TouchableOpacity, Text } from "react-native";

export function CommittedUpgradeCard({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        marginTop: 8,
        backgroundColor: "rgba(124, 58, 237, 0.10)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(124, 58, 237, 0.18)",
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
        Upgrade to Committed
      </Text>
      <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
        Committed lets you keep up to 3 active chats.
      </Text>
    </TouchableOpacity>
  );
}
