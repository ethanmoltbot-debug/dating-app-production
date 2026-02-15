import { View, Text, Pressable } from "react-native";

export function TierUnderlineTab({ label, selected, onPress, accent }) {
  const textColor = selected ? "#111" : "#6B7280";
  const underlineColor = selected ? accent : "transparent";

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
    >
      <Text style={{ color: textColor, fontWeight: selected ? "900" : "800" }}>
        {label}
      </Text>
      <View
        style={{
          marginTop: 8,
          height: 2,
          width: 26,
          borderRadius: 2,
          backgroundColor: underlineColor,
        }}
      />
    </Pressable>
  );
}
