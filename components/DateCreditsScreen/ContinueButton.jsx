import { TouchableOpacity, Text } from "react-native";

export function ContinueButton({ busy, title, subtitle, disabled, onPress }) {
  const isDisabled = Boolean(disabled) || Boolean(busy);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.9}
      style={{
        alignItems: "center",
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: isDisabled
          ? "rgba(17,17,17,0.06)"
          : "rgba(255, 23, 68, 0.10)",
        borderWidth: 1,
        borderColor: isDisabled
          ? "rgba(17,17,17,0.08)"
          : "rgba(255, 23, 68, 0.18)",
        opacity: busy ? 0.7 : 1,
      }}
    >
      <Text style={{ color: "#111", fontWeight: "900" }}>{title}</Text>
      {subtitle ? (
        <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
