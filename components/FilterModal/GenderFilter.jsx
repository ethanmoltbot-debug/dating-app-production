import { View, Text, TouchableOpacity } from "react-native";

const GENDER_OPTIONS = ["all", "women", "men", "nonbinary"];

export function GenderFilter({ gender, onChange }) {
  const getGenderLabel = (genderValue) => {
    if (genderValue === "all") return "All";
    if (genderValue === "nonbinary") return "NB";
    return genderValue.slice(0, 1).toUpperCase() + genderValue.slice(1, 3);
  };

  return (
    <View style={{ marginBottom: 32 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#2D2D2D",
          marginBottom: 16,
        }}
      >
        Show Me
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {GENDER_OPTIONS.map((genderOption) => (
          <TouchableOpacity
            key={genderOption}
            onPress={() => onChange(genderOption)}
            style={{
              flex: 1,
              paddingVertical: 12,
              backgroundColor: gender === genderOption ? "#FF1744" : "#F5F5F5",
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: gender === genderOption ? "#fff" : "#2D2D2D",
                textTransform: "capitalize",
              }}
            >
              {getGenderLabel(genderOption)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
