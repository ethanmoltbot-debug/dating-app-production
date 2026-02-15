import { TouchableOpacity, Text } from "react-native";

export function Pill({ label, active, onPress }) {
  const bg = active ? "#FFEEF1" : "#fff";
  const border = active ? "#FFCCD5" : "#E5E5E5";
  const textColor = active ? "#B00020" : "#2D2D2D";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color: textColor }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
