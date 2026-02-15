import { View, Text } from "react-native";

export function SystemMessage({ message }) {
  return (
    <View
      style={{
        alignSelf: "center",
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.75)",
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
      }}
    >
      <Text style={{ fontSize: 12, color: "#444", fontWeight: "800" }}>
        {String(message.message_text || "")}
      </Text>
    </View>
  );
}
