import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export function BottomActionBar({
  insets,
  primaryCta,
  isBusy,
  onSubscribe,
  accent,
}) {
  const router = useRouter();

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom + 14,
        paddingTop: 12,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E5E5EA",
      }}
    >
      <TouchableOpacity
        onPress={onSubscribe}
        activeOpacity={0.85}
        disabled={isBusy}
        style={{
          backgroundColor: accent,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
          opacity: isBusy ? 0.7 : 1,
        }}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
            {primaryCta}
          </Text>
        )}
      </TouchableOpacity>

      <Text
        style={{
          marginTop: 10,
          fontSize: 11,
          color: "#9CA3AF",
          lineHeight: 15,
          textAlign: "center",
        }}
      >
        Auto-renewal. Cancel anytime.
      </Text>

      <Text
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "#9CA3AF",
          lineHeight: 15,
          textAlign: "center",
        }}
      >
        By purchasing you agree to our{" "}
        <Text
          onPress={() => router.push("/profile/privacy")}
          style={{
            color: accent,
            textDecorationLine: "underline",
            textDecorationColor: accent,
          }}
        >
          Privacy Policy
        </Text>{" "}
        and our{" "}
        <Text
          onPress={() => router.push("/profile/terms")}
          style={{
            color: accent,
            textDecorationLine: "underline",
            textDecorationColor: accent,
          }}
        >
          Terms of Service
        </Text>
        .
      </Text>
    </View>
  );
}
