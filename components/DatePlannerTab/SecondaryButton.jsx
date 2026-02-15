import { TouchableOpacity, Text } from "react-native";

export function SecondaryButton({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        backgroundColor: "#fff",
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "900", color: "#111" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
