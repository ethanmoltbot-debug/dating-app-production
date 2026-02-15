import { View, Text } from "react-native";

export function StockedUpCard() {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.86)",
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
        You're stocked up
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 13,
          color: "#6B7280",
          lineHeight: 18,
        }}
      >
        You're at the max right now, so there's nothing to buy. Once you use a
        credit, you'll be able to add more here.
      </Text>
    </View>
  );
}
