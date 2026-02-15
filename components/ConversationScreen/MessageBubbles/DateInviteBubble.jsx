import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Star } from "lucide-react-native";
import { formatReviewLine } from "@/utils/messageHelpers";

export function DateInviteBubble({ invite, isMe, onPress, onLongPress }) {
  const d = invite?.date || {};
  const cover = String(d.coverImageUrl || "").trim();
  const place = String(d.placeLabel || "").trim();
  const activity = String(d.activityLabel || "").trim();
  const placeAddress = String(d.placeAddress || "").trim();
  const placeDescription = String(d.placeDescription || "").trim();

  const reviewLine = formatReviewLine({
    rating: d.placeRating,
    ratingsTotal: d.placeRatingsTotal,
  });

  const alignSelf = isMe ? "flex-end" : "flex-start";
  const cardBorder = isMe ? "rgba(255,23,68,0.25)" : "#E5E5E5";

  const actionLine = isMe ? "Tap to manage" : "Tap to respond";

  const bubbleMaxWidth = "94%";
  const shouldShowMeta = Boolean(placeAddress || placeDescription);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      activeOpacity={0.9}
      style={{
        alignSelf,
        maxWidth: bubbleMaxWidth,
        width: bubbleMaxWidth,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: cardBorder,
          backgroundColor: "#111",
        }}
      >
        <View style={{ height: 150 }}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : null}

          <LinearGradient
            colors={["rgba(0,0,0,0.65)", "rgba(0,0,0,0.15)"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={[
              StyleSheet.absoluteFill,
              { padding: 14, justifyContent: "flex-end" },
            ]}
          >
            {activity ? (
              <Text
                style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}
                numberOfLines={2}
              >
                {activity}
              </Text>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: activity ? 8 : 0,
              }}
            >
              <MapPin size={16} color="#fff" />
              <Text
                style={{
                  fontSize: activity ? 14 : 18,
                  fontWeight: "900",
                  color: "#fff",
                  flex: 1,
                }}
                numberOfLines={2}
              >
                {place}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 6,
          }}
        >
          {reviewLine ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Star size={14} color="#111" />
              <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
                {reviewLine}
              </Text>
            </View>
          ) : null}

          {shouldShowMeta ? (
            <View style={{ gap: 4 }}>
              {placeAddress ? (
                <Text
                  style={{ fontSize: 12, color: "#6B7280" }}
                  numberOfLines={1}
                >
                  {placeAddress}
                </Text>
              ) : null}

              {placeDescription ? (
                <Text
                  style={{ fontSize: 12, color: "#111", lineHeight: 16 }}
                  numberOfLines={2}
                >
                  {placeDescription}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={{ fontSize: 12, color: "#6B7280" }} numberOfLines={1}>
            {actionLine}
          </Text>
        </View>
      </View>

      <View
        style={{
          alignSelf: isMe ? "flex-end" : "flex-start",
          marginTop: 6,
        }}
      >
        <View
          style={{
            backgroundColor: isMe ? "#FF1744" : "#111",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 12, color: "#fff", fontWeight: "900" }}>
            {isMe ? "You invited them" : "Date invite"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
