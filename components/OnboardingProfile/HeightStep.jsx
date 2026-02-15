import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { HEIGHT_OPTIONS, formatHeight } from "@/utils/onboardingProfileHelpers";

export function HeightStep({ heightInches, setHeightInches, labelStyle }) {
  const selectedLabel = heightInches ? formatHeight(heightInches) : "";

  return (
    <View>
      <Text style={labelStyle}>Select your height</Text>

      <ScrollView
        style={{ maxHeight: 360 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 10 }}>
          {HEIGHT_OPTIONS.map((opt) => {
            const selected = opt.inches === heightInches;
            const borderColor = selected
              ? "rgba(124,58,237,0.40)"
              : "rgba(17,17,17,0.10)";
            const backgroundColor = selected
              ? "rgba(124,58,237,0.10)"
              : "rgba(255,255,255,0.8)";
            const fontWeight = selected ? "900" : "800";

            return (
              <TouchableOpacity
                key={opt.inches}
                activeOpacity={0.85}
                onPress={() => setHeightInches(opt.inches)}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor,
                  backgroundColor,
                }}
              >
                <Text style={{ color: "#111", fontWeight, fontSize: 16 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedLabel ? (
        <Text
          style={{
            marginTop: 10,
            color: "#6B7280",
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          Selected: {selectedLabel}
        </Text>
      ) : null}
    </View>
  );
}
