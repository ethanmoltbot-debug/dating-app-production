import { View, Text } from "react-native";
import { THEME } from "./theme";

export function BasicsPill({ icon: Icon, text }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: "rgba(17,24,39,0.03)",
        borderWidth: 1,
        borderColor: "rgba(17,24,39,0.06)",
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: "rgba(255,255,255,0.90)",
          borderWidth: 1,
          borderColor: "rgba(17,24,39,0.06)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} color={THEME.text} />
      </View>
      <Text style={{ color: THEME.text, fontWeight: "800", flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
