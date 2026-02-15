import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import CountryPickerModal from "@/components/CountryPickerModal";
import { getCountryByIso2 } from "@/utils/countryCallingCodes";
import { OTP_SUPPORTED_COUNTRIES } from "@/utils/phone";

export function StepPhoneOtp({
  countryIso2,
  setCountryIso2,
  phone,
  setPhone,
  code,
  setCode,
  onSendCode,
  onVerifyCode,
  canVerify,
  sending,
  verifying,
  inputStyle,
  labelStyle,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const country = useMemo(() => getCountryByIso2(countryIso2), [countryIso2]);

  const isSupported = useMemo(() => {
    const key = String(countryIso2 || "").toUpperCase();
    return OTP_SUPPORTED_COUNTRIES.includes(key);
  }, [countryIso2]);

  const helperText = useMemo(() => {
    if (!isSupported) {
      return "SMS is not available for this country yet.";
    }
    return "We’ll text you a code. Standard SMS rates may apply.";
  }, [isSupported]);

  const countryLabel = useMemo(() => {
    const name = country?.name || "Country";
    const dial = country?.dialCode ? `+${country.dialCode}` : "";
    return `${name} ${dial}`.trim();
  }, [country]);

  const sendDisabled = sending || !isSupported;

  return (
    <>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#111",
          textAlign: "center",
          marginBottom: 14,
        }}
      >
        Verify your phone
      </Text>

      <View style={{ marginBottom: 12 }}>
        <Text style={labelStyle}>Phone number</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.85}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: "rgba(17,17,17,0.04)",
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.08)",
              maxWidth: 170,
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: 14, fontWeight: "900", color: "#111" }}
            >
              {countryLabel}
            </Text>
          </TouchableOpacity>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            autoCapitalize="none"
            returnKeyType="done"
            style={{ ...inputStyle, flex: 1 }}
          />
        </View>

        <Text
          style={{
            fontSize: 12,
            color: isSupported ? "#6B7280" : "#9CA3AF",
            marginTop: 6,
            fontWeight: "700",
          }}
        >
          {helperText}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onSendCode}
        disabled={sendDisabled}
        activeOpacity={0.9}
        style={{
          backgroundColor: "rgba(17,17,17,0.06)",
          borderRadius: 14,
          paddingVertical: 12,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.08)",
          marginBottom: 14,
          opacity: sendDisabled ? 0.5 : 1,
        }}
      >
        {sending ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator />
            <Text style={{ fontWeight: "900", color: "#111" }}>Sending…</Text>
          </View>
        ) : (
          <Text style={{ fontWeight: "900", color: "#111" }}>Send code</Text>
        )}
      </TouchableOpacity>

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
        />
      </View>

      <TouchableOpacity
        onPress={onVerifyCode}
        disabled={!canVerify || verifying}
        activeOpacity={0.9}
        style={{
          backgroundColor: "#111",
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
          opacity: !canVerify || verifying ? 0.5 : 1,
        }}
      >
        {verifying ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator color="#fff" />
            <Text style={{ fontWeight: "900", color: "#fff" }}>Verifying…</Text>
          </View>
        ) : (
          <Text style={{ fontWeight: "900", color: "#fff" }}>Verify</Text>
        )}
      </TouchableOpacity>

      <CountryPickerModal
        visible={pickerOpen}
        selectedIso2={countryIso2}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => setCountryIso2?.(item.iso2)}
      />
    </>
  );
}
