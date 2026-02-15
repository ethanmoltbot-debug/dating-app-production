import { TouchableOpacity, Text } from "react-native";

const ACCENT = "#FF1744";

export function PrimaryButton({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: ACCENT,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
