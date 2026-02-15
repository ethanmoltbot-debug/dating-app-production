import { View, Text } from "react-native";
import LocationAutocompleteInput from "@/components/LocationAutocompleteInput";

export function BornInStep({
  bornIn,
  setBornIn,
  labelStyle,
  inputStyle,
  validateAndNext,
}) {
  return (
    <View>
      <Text style={labelStyle}>Where were you born?</Text>

      <LocationAutocompleteInput
        value={bornIn}
        onChangeText={setBornIn}
        placeholder="City, State/Country"
        placeholderTextColor="#6B7280"
        containerStyle={inputStyle}
        textInputStyle={{
          paddingVertical: 0,
          backgroundColor: "transparent",
          borderWidth: 0,
          fontWeight: "700",
        }}
        types="(cities)"
        maxHeight={220}
        returnKeyType="done"
        onSubmitEditing={validateAndNext}
      />
    </View>
  );
}
