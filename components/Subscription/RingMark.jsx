import { View, Text } from "react-native";

export function RingMark({ accent }) {
  // Replace the ring+diamond icon with a simple 💍 glyph so it reads clearly as a ring.
  return (
    <View
      style={{
        width: 66,
        height: 66,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 40, lineHeight: 44 }}>💍</Text>
    </View>
  );
}
