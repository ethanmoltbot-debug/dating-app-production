import { View, Text, Pressable } from "react-native";
import { RingMark } from "./RingMark";

export function HeroSection({
  heroTitle,
  heroSubtitle,
  adminBannerText,
  secondaryCta,
  onPressSecondary,
  accent,
}) {
  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <RingMark accent={accent} />
      </View>

      <Text
        style={{
          textAlign: "center",
          fontSize: 26,
          lineHeight: 32,
          color: "#111",
          fontWeight: "600",
        }}
      >
        {heroTitle}
      </Text>

      <Text
        style={{
          textAlign: "center",
          fontSize: 15,
          lineHeight: 22,
          color: "#6B7280",
          marginTop: 10,
        }}
      >
        {heroSubtitle}
      </Text>

      {adminBannerText ? (
        <View
          style={{
            alignSelf: "center",
            marginTop: 10,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: "rgba(168, 85, 247, 0.10)",
            borderWidth: 1,
            borderColor: "rgba(168, 85, 247, 0.18)",
          }}
        >
          <Text style={{ color: accent, fontWeight: "700", fontSize: 12 }}>
            {adminBannerText}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onPressSecondary}
        style={{ marginTop: 12, alignSelf: "center", paddingVertical: 6 }}
      >
        <Text style={{ color: accent, fontWeight: "600", fontSize: 13 }}>
          {secondaryCta}
        </Text>
      </Pressable>
    </View>
  );
}
