import { View, Text, TextInput } from "react-native";

export function StepName({ name, setName, onSubmit, inputStyle }) {
  return (
    <>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#111",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        What should we call you?
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="First name"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={onSubmit}
        style={inputStyle}
      />
    </>
  );
}
