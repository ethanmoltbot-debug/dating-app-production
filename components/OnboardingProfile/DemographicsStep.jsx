import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";

function OptionPicker({
  title,
  value,
  onChange,
  options,
  labelStyle,
  inputStyle,
}) {
  const [open, setOpen] = useState(false);

  const displayValue = value ? String(value) : "";
  const placeholder = "Select";
  const showText = displayValue || placeholder;
  const textColor = displayValue ? "#111" : "#6B7280";

  return (
    <View>
      <Text style={labelStyle}>{title}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        style={{
          ...inputStyle,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: textColor, fontWeight: "800" }}>{showText}</Text>
        <Text style={{ color: "#6B7280", fontWeight: "900" }}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-end",
          }}
        >
          {/* Tap outside to close (this is rendered BEFORE the sheet so it doesn't block taps inside it) */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setOpen(false)}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />

          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 10,
              paddingBottom: 18,
              maxHeight: "70%",
            }}
          >
            <View
              style={{
                paddingHorizontal: 18,
                paddingBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "rgba(17,17,17,0.08)",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#111" }}>
                {title}
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#6B7280", fontWeight: "900" }}>
                    Clear
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#111", fontWeight: "900" }}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 18, gap: 8 }}
            >
              {options.map((opt) => {
                const selected = opt === displayValue;
                const backgroundColor = selected
                  ? "rgba(124,58,237,0.10)"
                  : "rgba(17,17,17,0.03)";
                const borderColor = selected
                  ? "rgba(124,58,237,0.30)"
                  : "rgba(17,17,17,0.06)";

                return (
                  <TouchableOpacity
                    key={opt}
                    activeOpacity={0.85}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      backgroundColor,
                      borderWidth: 1,
                      borderColor,
                    }}
                  >
                    <Text
                      style={{
                        color: "#111",
                        fontWeight: selected ? "900" : "800",
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function EthnicityStep({
  ethnicity,
  setEthnicity,
  labelStyle,
  inputStyle,
}) {
  const options = useMemo(
    () => [
      "Asian",
      "Black / African descent",
      "Hispanic / Latino",
      "Middle Eastern",
      "Native American",
      "Pacific Islander",
      "White / Caucasian",
      "Mixed",
      "Other",
    ],
    [],
  );

  return (
    <OptionPicker
      title="Ethnicity (optional)"
      value={ethnicity}
      onChange={setEthnicity}
      options={options}
      labelStyle={labelStyle}
      inputStyle={inputStyle}
    />
  );
}

export function ReligionStep({
  religion,
  setReligion,
  labelStyle,
  inputStyle,
}) {
  const options = useMemo(
    () => [
      "Agnostic",
      "Atheist",
      "Buddhist",
      "Christian",
      "Hindu",
      "Jewish",
      "Muslim",
      "Spiritual",
      "Other",
    ],
    [],
  );

  return (
    <OptionPicker
      title="Religion (optional)"
      value={religion}
      onChange={setReligion}
      options={options}
      labelStyle={labelStyle}
      inputStyle={inputStyle}
    />
  );
}

export function PoliticsStep({
  politics,
  setPolitics,
  labelStyle,
  inputStyle,
}) {
  const options = useMemo(
    () => [
      "Liberal",
      "Moderate",
      "Conservative",
      "Libertarian",
      "Not political",
      "Prefer not to say",
    ],
    [],
  );

  return (
    <OptionPicker
      title="Political views (optional)"
      value={politics}
      onChange={setPolitics}
      options={options}
      labelStyle={labelStyle}
      inputStyle={inputStyle}
    />
  );
}
