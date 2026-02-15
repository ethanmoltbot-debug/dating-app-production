import { View, Text } from "react-native";

export function Section({ title, subtitle, children }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 22 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "800",
          color: "#6B7280",
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
          {subtitle}
        </Text>
      ) : null}
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}
