import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

export function SessionNotFoundState({ insets, title, subtitle, onSignIn }) {
  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
      <View
        style={{
          paddingTop: insets.top + 22,
          paddingHorizontal: 20,
          paddingBottom: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 30, fontWeight: "900", color: "#111" }}>
          {title}
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          {subtitle}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "rgba(255,255,255,0.94)",
            borderRadius: 26,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.12,
            shadowRadius: 22,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
            Session not found
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: "#6B7280" }}>
            Please sign in again.
          </Text>

          <TouchableOpacity
            onPress={onSignIn}
            activeOpacity={0.9}
            style={{ marginTop: 14, borderRadius: 14, overflow: "hidden" }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 13, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
