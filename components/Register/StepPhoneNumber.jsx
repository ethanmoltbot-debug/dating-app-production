import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import CountryPickerModal from "@/components/CountryPickerModal";
import { getCountryByIso2, iso2ToFlagEmoji } from "@/utils/countryCallingCodes";
import { OTP_SUPPORTED_COUNTRIES } from "@/utils/phone";

export function StepPhoneNumber({
  countryIso2,
  setCountryIso2,
  phone,
  setPhone,
  inputStyle,
  labelStyle,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const country = useMemo(() => getCountryByIso2(countryIso2), [countryIso2]);

  const countryPillLabel = useMemo(() => {
    const flag = iso2ToFlagEmoji(countryIso2);
    const dial = country?.dialCode ? `+${country.dialCode}` : "+";
    return `${flag} ${dial}`;
  }, [country?.dialCode, countryIso2]);

  const isSupported = useMemo(() => {
    const key = String(countryIso2 || "").toUpperCase();
    return OTP_SUPPORTED_COUNTRIES.includes(key);
  }, [countryIso2]);

  const helperText = useMemo(() => {
    if (!isSupported) {
      return "SMS is not available for this country yet.";
    }
    return "We’ll text you a 6-digit code.";
  }, [isSupported]);

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
        What’s your phone number?
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#6B7280",
          textAlign: "center",
          marginBottom: 18,
          fontWeight: "700",
        }}
      >
        {helperText}
      </Text>

      <View style={{ marginBottom: 6 }}>
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
              minWidth: 88,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
              {countryPillLabel}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
              ▾
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

        {!isSupported ? (
          <Text
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              marginTop: 6,
              fontWeight: "700",
            }}
          >
            SMS is not available for this country yet.
          </Text>
        ) : null}
      </View>

      <CountryPickerModal
        visible={pickerOpen}
        selectedIso2={countryIso2}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => setCountryIso2?.(item.iso2)}
      />
    </>
  );
}
