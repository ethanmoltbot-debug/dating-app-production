import { View, Text } from "react-native";

export function SectionHeader({ title }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "900",
          color: "#111",
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
