import { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COUNTRY_CALLING_CODES,
  getCountryByIso2,
  iso2ToFlagEmoji,
} from "@/utils/countryCallingCodes";

function CountryRow({ item, isSelected, onPress }) {
  const flag = iso2ToFlagEmoji(item.iso2);
  const label = `${flag}  ${item.name}  +${item.dialCode}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: isSelected ? "rgba(124,58,237,0.10)" : "transparent",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "800",
            color: "#111",
          }}
        >
          {label}
        </Text>
        {isSelected ? (
          <Text style={{ fontSize: 12, fontWeight: "900", color: "#7C3AED" }}>
            Selected
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function CountryPickerModal({
  visible,
  selectedIso2,
  onClose,
  onSelect,
}) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => getCountryByIso2(selectedIso2),
    [selectedIso2],
  );

  const filtered = useMemo(() => {
    const q = String(search || "")
      .trim()
      .toLowerCase();
    if (!q) return COUNTRY_CALLING_CODES;

    return COUNTRY_CALLING_CODES.filter((c) => {
      const name = String(c.name || "").toLowerCase();
      const iso2 = String(c.iso2 || "").toLowerCase();
      const dial = String(c.dialCode || "").toLowerCase();
      return name.includes(q) || iso2.includes(q) || dial.includes(q);
    });
  }, [search]);

  const headerText = selected?.name
    ? `Selected: ${iso2ToFlagEmoji(selected.iso2)} ${selected.name} (+${selected.dialCode})`
    : "Select a country";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          paddingTop: insets.top,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ flex: 1 }}
        />

        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            paddingBottom: insets.bottom + 14,
            borderTopWidth: 1,
            borderColor: "rgba(17,17,17,0.10)",
            maxHeight: "80%",
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <View
              style={{
                alignSelf: "center",
                width: 54,
                height: 5,
                borderRadius: 999,
                backgroundColor: "rgba(17,17,17,0.14)",
                marginBottom: 12,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
                Country code
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text
                  style={{ fontSize: 14, fontWeight: "900", color: "#7C3AED" }}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "700" }}>
              {headerText}
            </Text>

            <View style={{ height: 12 }} />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search country or code"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              style={{
                backgroundColor: "rgba(17,17,17,0.04)",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.08)",
                fontSize: 15,
                color: "#111",
                fontWeight: "700",
              }}
            />
          </View>

          <View style={{ height: 10 }} />

          <FlatList
            data={filtered}
            keyExtractor={(item, idx) => `${item.iso2}-${item.dialCode}-${idx}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 14 }}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: "rgba(17,17,17,0.06)",
                  marginHorizontal: 8,
                }}
              />
            )}
            renderItem={({ item }) => {
              const isSelected = item.iso2 === selectedIso2;
              return (
                <CountryRow
                  item={item}
                  isSelected={isSelected}
                  onPress={() => {
                    onSelect?.(item);
                    onClose?.();
                  }}
                />
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
