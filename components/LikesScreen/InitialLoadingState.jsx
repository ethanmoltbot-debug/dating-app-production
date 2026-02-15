import { View, ActivityIndicator } from "react-native";

export function InitialLoadingState() {
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
    </View>
  );
}
