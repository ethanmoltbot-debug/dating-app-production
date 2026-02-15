import { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

export function StepOtpCode({
  phoneLabel,
  code,
  setCode,
  onResend,
  onChangeNumber,
  sending,
  verifying,
  inputStyle,
  labelStyle,
}) {
  const subtitle = useMemo(() => {
    if (!phoneLabel) return "Enter the 6-digit code we texted you.";
    return `Enter the 6-digit code we sent to ${phoneLabel}.`;
  }, [phoneLabel]);

  const disabled = sending || verifying;

  return (
    <>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#111",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Enter your code
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#6B7280",
          textAlign: "center",
          marginBottom: 10,
          fontWeight: "700",
        }}
      >
        {subtitle}
      </Text>

      {onChangeNumber ? (
        <TouchableOpacity
          onPress={onChangeNumber}
          disabled={disabled}
          activeOpacity={0.85}
          style={{
            alignSelf: "center",
            paddingVertical: 6,
            paddingHorizontal: 10,
            opacity: disabled ? 0.6 : 1,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 13, color: "#111", fontWeight: "900" }}>
            Change number
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ marginBottom: 12 }}>
        <Text style={labelStyle}>Verification code</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          autoCapitalize="none"
          returnKeyType="done"
          style={inputStyle}
          maxLength={6}
        />
      </View>

      <TouchableOpacity
        onPress={onResend}
        disabled={disabled}
        activeOpacity={0.85}
        style={{
          alignSelf: "center",
          paddingVertical: 8,
          paddingHorizontal: 10,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {sending ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator size="small" />
            <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "800" }}>
              Resending…
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: "#7C3AED", fontWeight: "900" }}>
            Resend code
          </Text>
        )}
      </TouchableOpacity>
    </>
  );
}
