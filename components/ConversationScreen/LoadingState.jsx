import { View, ActivityIndicator, Text } from "react-native";

export function LoadingState({ message = "Loading…" }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#FF1744" />
      {message ? (
        <Text style={{ marginTop: 12, color: "#666" }}>{message}</Text>
      ) : null}
    </View>
  );
}
