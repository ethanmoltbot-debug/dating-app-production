import { Animated, View, Text } from "react-native";

const TIMESTAMP_WIDTH = 92;

export function SwipeTimestampRow({ main, timestampLabel, swipeX }) {
  // Tinder-style: timestamps are hidden off-screen to the right.
  // The parent list provides a shared `swipeX` Animated.Value (0 .. -TIMESTAMP_WIDTH)
  // while the user drags left.
  const translateX = swipeX || 0;

  return (
    <View style={{ width: "100%", overflow: "hidden" }}>
      <Animated.View
        style={{
          flexDirection: "row",
          transform: [{ translateX }],
        }}
      >
        {/* main content takes the full row width */}
        <View style={{ width: "100%" }}>{main}</View>

        {/* timestamp sits just off-screen to the right */}
        <View
          style={{
            width: TIMESTAMP_WIDTH,
            alignItems: "flex-start",
            justifyContent: "flex-end",
            paddingBottom: 12,
            paddingLeft: 8,
          }}
        >
          <Text style={{ fontSize: 10, color: "#8B8B95", fontWeight: "800" }}>
            {timestampLabel}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
