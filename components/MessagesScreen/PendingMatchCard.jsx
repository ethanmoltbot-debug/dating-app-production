import { View, Text } from "react-native";

export function PendingMatchCard({ count }) {
  if (count <= 0) return null;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: "rgba(255,255,255,0.72)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "900", color: "#111" }}>
        {count > 1 ? `${count} matches pending` : "Match pending"}
      </Text>
      <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
        You'll be notified if this path opens.
      </Text>
    </View>
  );
}
