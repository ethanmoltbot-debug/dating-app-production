import { View, Text } from "react-native";

export function LikesHeader({ insets, title, subtitle }) {
  return (
    <View
      style={{
        paddingTop: insets.top + 30,
        paddingHorizontal: 20,
        paddingBottom: 18,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 32, fontWeight: "900", color: "#111" }}>
        {title}
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 13,
          color: "#6B7280",
          textAlign: "center",
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}
