import { View, Text } from "react-native";

export function StatusPill({ label }) {
  const isPending = label === "Pending";
  const bg = isPending ? "#FFF7ED" : "#F0FDF4";
  const border = isPending ? "#FED7AA" : "#BBF7D0";
  const text = isPending ? "#9A3412" : "#166534";

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "900", color: text }}>
        {label}
      </Text>
    </View>
  );
}
