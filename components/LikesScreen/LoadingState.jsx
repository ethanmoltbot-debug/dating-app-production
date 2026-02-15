import { View, Text, ActivityIndicator } from "react-native";

const ACCENT = "#A855F7";

export function LoadingState({ label }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <ActivityIndicator size="large" color={ACCENT} />
      <Text style={{ marginTop: 12, color: "#6B7280", fontWeight: "800" }}>
        {label}
      </Text>
    </View>
  );
}
