import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftBlobsBackground } from "./SoftBlobsBackground";

export function ErrorScreen({
  error,
  onRetry,
  onBack,
  bgGradient,
  ctaGradient,
}) {
  const insets = useSafeAreaInsets();
  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
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
          padding: 24,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 24,
            paddingVertical: 22,
            paddingHorizontal: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#111",
              lineHeight: 28,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            One moment
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#374151",
              lineHeight: 22,
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            {errorMessage}
          </Text>

          <View style={{ marginTop: 18, gap: 10 }}>
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.9}
              style={{
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, alignItems: "center" }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}
                >
                  Try again
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.9}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.10)",
                backgroundColor: "rgba(17,17,17,0.03)",
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#111", fontWeight: "900" }}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
