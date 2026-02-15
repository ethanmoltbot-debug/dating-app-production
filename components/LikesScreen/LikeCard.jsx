import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { MapPin } from "lucide-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];
const CTA_GRADIENT_PRESSED = ["#FF3BCF", "#6D28D9"];

export function LikeCard({
  like,
  cardWidth,
  isLocked,
  freeVisibleCount,
  index,
  onOpenProfile,
  onUpgrade,
  onLikeBack,
  isLiking,
}) {
  const photoUri = like.photos?.[0] || "https://via.placeholder.com/200";

  const displayName = String(like?.display_name || "").trim();
  const ageNum = Number(like?.age);
  const ageText = Number.isFinite(ageNum) ? String(ageNum) : "";
  const nameAge = displayName && ageText ? `${displayName}, ${ageText}` : "";

  const locationText = like.location ? String(like.location) : "";

  const isOnline = Boolean(like?.is_online);
  const presenceLabel = isOnline ? "Online" : "Offline";
  const presenceDotColor = isOnline ? "#22C55E" : "#9CA3AF";
  const presencePillBg = isOnline
    ? "rgba(34, 197, 94, 0.14)"
    : "rgba(156, 163, 175, 0.14)";
  const presenceTextColor = isOnline ? "#16A34A" : "#6B7280";

  const likeButtonColors = isLiking ? CTA_GRADIENT_PRESSED : CTA_GRADIENT;
  const likeButtonText = isLiking ? "Liking…" : "Like back";
  const likeButtonOpacity = isLiking ? 0.7 : 1;

  const canViewThisLike = !isLocked || index < freeVisibleCount;

  // Locked = always blurred, only show name + age, with an upgrade prompt.
  if (!canViewThisLike) {
    return (
      <Pressable
        key={like.id}
        onPress={() => onUpgrade?.(displayName)}
        style={{
          width: cardWidth,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderRadius: 20,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 18,
        }}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: photoUri }}
            style={{ width: "100%", height: 260 }}
            contentFit="cover"
            transition={150}
            blurRadius={28}
          />

          <BlurView
            intensity={30}
            tint="light"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          <View
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 12,
            }}
          >
            {nameAge ? (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "900",
                  textShadowColor: "rgba(0,0,0,0.65)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 6,
                }}
                numberOfLines={1}
              >
                {nameAge}
              </Text>
            ) : null}

            <View style={{ height: 10 }} />

            <View style={{ borderRadius: 12, overflow: "hidden" }}>
              <LinearGradient
                colors={CTA_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 10, alignItems: "center" }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}
                >
                  Unlock this like
                </Text>
              </LinearGradient>
            </View>

            <Text
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "rgba(255,255,255,0.92)",
                fontWeight: "800",
                textShadowColor: "rgba(0,0,0,0.55)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
              numberOfLines={2}
            >
              Become Committed to view their profile and like back.
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Unlocked
  const nameText = nameAge || `${like.display_name || ""}`;

  return (
    <Pressable
      key={like.id}
      onPress={() => onOpenProfile(like?.id)}
      style={{
        width: cardWidth,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      }}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: photoUri }}
          style={{ width: "100%", height: 200 }}
          contentFit="cover"
          transition={150}
        />

        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "rgba(255,255,255,0.85)",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: presenceDotColor,
              marginRight: 6,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "900",
              color: presenceTextColor,
            }}
          >
            {presenceLabel}
          </Text>
        </View>

        <View
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            width: 14,
            height: 14,
            borderRadius: 999,
            backgroundColor: presenceDotColor,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.95)",
          }}
        />
      </View>

      <View style={{ padding: 12 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: "#111",
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {nameText}
        </Text>

        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: presencePillBg,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "900",
              color: presenceTextColor,
            }}
          >
            {presenceLabel}
          </Text>
        </View>

        {locationText ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <MapPin size={12} color="#6B7280" />
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                marginLeft: 4,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {locationText}
            </Text>
          </View>
        ) : (
          <View style={{ height: 14, marginBottom: 10 }} />
        )}

        <TouchableOpacity
          onPress={() => onLikeBack(like)}
          disabled={isLiking}
          activeOpacity={0.9}
          style={{
            borderRadius: 12,
            overflow: "hidden",
            opacity: likeButtonOpacity,
          }}
        >
          <LinearGradient
            colors={likeButtonColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 11, alignItems: "center" }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: "900",
              }}
            >
              {likeButtonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#6B7280",
            textAlign: "center",
            fontWeight: "800",
          }}
        >
          Tap the card to view their profile
        </Text>
      </View>
    </Pressable>
  );
}
