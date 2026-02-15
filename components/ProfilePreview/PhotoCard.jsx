import { useMemo } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, BadgeCheck } from "lucide-react-native";
import { Card } from "./Card";
import { MediaTopBar } from "./MediaTopBar";
import { formatDistanceMiles } from "@/utils/profileFormatters";

export function PhotoCard({
  uri,
  isHero,
  title,
  subtitle,
  location,
  bio,
  badgeText,
  isVerified,
  distanceMiles,
  onPressMenu,
  onPressImage,
  containerRef, // NEW: optional ref for measuring (tutorial pointers)
}) {
  // Make all photos 1:1 (including the first/hero photo)
  const cardStyle = useMemo(() => {
    return {
      width: "100%",
      aspectRatio: 1,
    };
  }, []);

  const gradientColors = isHero
    ? ["transparent", "rgba(0,0,0,0.78)"]
    : ["transparent", "rgba(0,0,0,0.55)"];

  // Slightly taller fade on the first photo so the name/location text stays readable.
  const gradientHeight = isHero ? 190 : 150;

  const displayTitle = subtitle || title;

  const distanceLabel = formatDistanceMiles(distanceMiles);

  const locationLineText = useMemo(() => {
    const loc = typeof location === "string" ? location.trim() : "";
    const dist = typeof distanceLabel === "string" ? distanceLabel.trim() : "";

    if (loc && dist) {
      return `${loc} • ${dist}`;
    }
    return loc || dist;
  }, [distanceLabel, location]);

  const showLocationLine = !!locationLineText;

  const cardBody = (
    <>
      <Image
        source={{ uri: uri || "https://via.placeholder.com/800" }}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        resizeMode="cover"
      />

      <MediaTopBar leftText={badgeText} onPressMenu={onPressMenu} />

      <LinearGradient
        colors={gradientColors}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: gradientHeight,
        }}
      />

      {isHero ? (
        <View style={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 30, fontWeight: "900", color: "#fff" }}>
              {displayTitle}
            </Text>

            {isVerified ? (
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "rgba(56,189,248,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(56,189,248,0.35)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 2,
                }}
              >
                <BadgeCheck size={18} color="#38BDF8" />
              </View>
            ) : null}
          </View>

          {showLocationLine ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <MapPin size={16} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 6, fontSize: 15 }}>
                {locationLineText}
              </Text>
            </View>
          ) : null}

          {bio ? (
            <Text
              style={{
                marginTop: 10,
                color: "rgba(255,255,255,0.88)",
                fontSize: 14,
                lineHeight: 20,
              }}
              numberOfLines={3}
            >
              {bio}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );

  // Wrap the whole card in a press target when caller wants full-screen viewing.
  const Wrapper = onPressImage ? TouchableOpacity : View;
  const wrapperProps = onPressImage
    ? {
        onPress: onPressImage,
        activeOpacity: 0.98,
        accessibilityRole: "button",
        accessibilityLabel: "Open photo",
      }
    : {};

  return (
    <Wrapper ref={containerRef} {...wrapperProps}>
      <Card style={cardStyle}>{cardBody}</Card>
    </Wrapper>
  );
}
