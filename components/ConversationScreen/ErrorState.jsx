import { View, Text, TouchableOpacity } from "react-native";

export function ErrorState({ error, onGoBack, insets }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top + 16,
        paddingHorizontal: 18,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "800", color: "#111" }}>
        Couldn't open this chat
      </Text>
      <Text style={{ marginTop: 10, fontSize: 14, color: "#B00020" }}>
        {error}
      </Text>
      <TouchableOpacity
        onPress={onGoBack}
        style={{
          marginTop: 16,
          alignSelf: "flex-start",
          backgroundColor: "#111",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Go back</Text>
      </TouchableOpacity>
    </View>
  );
}
