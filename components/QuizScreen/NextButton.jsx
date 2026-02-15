import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function NextButton({ onPress, isEnabled, submitting, ctaGradient }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: insets.bottom + 18,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={!isEnabled || submitting}
        activeOpacity={0.9}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          opacity: !isEnabled || submitting ? 0.6 : 1,
        }}
      >
        <LinearGradient
          colors={ctaGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18, alignItems: "center" }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={{
                color: "#fff",
                fontSize: 17,
                fontWeight: "900",
              }}
            >
              Next →
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
