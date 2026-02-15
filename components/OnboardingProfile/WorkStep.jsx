import { View, Text, TextInput } from "react-native";

export function WorkStep({
  jobTitle,
  setJobTitle,
  company,
  setCompany,
  labelStyle,
  inputStyle,
  validateAndNext,
}) {
  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={labelStyle}>Occupation</Text>
        <TextInput
          value={jobTitle}
          onChangeText={setJobTitle}
          placeholder="What do you do?"
          placeholderTextColor="#6B7280"
          style={inputStyle}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View>
        <Text style={labelStyle}>Company (optional)</Text>
        <TextInput
          value={company}
          onChangeText={setCompany}
          placeholder="Where do you work?"
          placeholderTextColor="#6B7280"
          style={inputStyle}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={validateAndNext}
        />
      </View>
    </View>
  );
}
