import { View, Text, TouchableOpacity } from "react-native";

export function DateCreditsHeader({ onClose, topInset }) {
  return (
    <View
      style={{
        paddingTop: topInset + 16,
        paddingHorizontal: 18,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>
        Date credits
      </Text>

      <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
        <Text style={{ color: "#111", fontWeight: "900" }}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}
