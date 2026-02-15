import { View, Text, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftBlobsBackground } from "./SoftBlobsBackground";

export function TransitionScreen({
  message,
  bgGradient,
  accent,
  transitionFadeAnim,
  transitionScaleAnim,
  dot1Anim,
  dot2Anim,
  dot3Anim,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <StatusBar style="dark" />

      <LinearGradient
        colors={bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 24,
            paddingVertical: 22,
            paddingHorizontal: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            opacity: transitionFadeAnim,
            transform: [{ scale: transitionScaleAnim }],
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: "#111",
              textAlign: "center",
              marginBottom: 18,
            }}
          >
            {message}
          </Text>

          {/* Animated Loading Dots */}
          <Animated.View
            style={{
              flexDirection: "row",
              gap: 12,
              opacity: transitionFadeAnim,
            }}
          >
            <Animated.View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: accent,
                transform: [{ translateY: dot1Anim }],
              }}
            />
            <Animated.View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: accent,
                transform: [{ translateY: dot2Anim }],
              }}
            />
            <Animated.View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: accent,
                transform: [{ translateY: dot3Anim }],
              }}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}
