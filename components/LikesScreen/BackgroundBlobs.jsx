import { View } from "react-native";

const ORB_A = "rgba(255, 79, 216, 0.16)";
const ORB_B = "rgba(124, 58, 237, 0.14)";
const ORB_C = "rgba(99, 179, 237, 0.16)";

export function BackgroundBlobs() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -80,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: ORB_A,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 120,
          right: -110,
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: ORB_B,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -120,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: ORB_C,
        }}
      />
    </View>
  );
}
