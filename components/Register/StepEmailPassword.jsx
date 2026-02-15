import { View, Text, TextInput } from "react-native";

export function StepEmailPassword({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  inputStyle,
  labelStyle,
}) {
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
        Create your login
      </Text>

      <View style={{ marginBottom: 12 }}>
        <Text style={labelStyle}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          style={inputStyle}
        />
      </View>

      <View style={{ marginBottom: 2 }}>
        <Text style={labelStyle}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          style={inputStyle}
        />
        <Text
          style={{
            fontSize: 12,
            color: "#6B7280",
            marginTop: 6,
            fontWeight: "700",
          }}
        >
          At least 6 characters
        </Text>
      </View>
    </>
  );
}
