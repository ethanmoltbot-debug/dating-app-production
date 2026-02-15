import { View, Text } from "react-native";
import { RangeSlider } from "@/components/PreferenceSliders/Sliders";

export function AgeRangeStep({
  ageMin,
  ageMax,
  setAgeMin,
  setAgeMax,
  accent,
  labelStyle,
}) {
  return (
    <View>
      <Text style={labelStyle}>Preferred age range</Text>

      <View
        style={{
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.08)",
          backgroundColor: "rgba(17,17,17,0.02)",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#111",
            textAlign: "center",
          }}
        >
          {ageMin}–{ageMax}
        </Text>

        <RangeSlider
          min={18}
          max={80}
          step={1}
          minValue={ageMin}
          maxValue={ageMax}
          activeColor={accent}
          onChange={({ minValue, maxValue }) => {
            setAgeMin(minValue);
            setAgeMax(maxValue);
          }}
        />

        <Text
          style={{
            marginTop: 2,
            fontSize: 12,
            color: "#6B7280",
            textAlign: "center",
            lineHeight: 16,
          }}
        >
          You can change this later.
        </Text>
      </View>
    </View>
  );
}
