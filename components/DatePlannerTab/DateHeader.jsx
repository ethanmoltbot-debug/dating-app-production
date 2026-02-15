import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, ChevronRight, Star } from "lucide-react-native";

function formatReviewLine({ rating, ratingsTotal }) {
  const r = Number(rating);
  const n = Number(ratingsTotal);

  const hasRating = Number.isFinite(r);
  const hasCount = Number.isFinite(n) && n > 0;

  if (!hasRating && !hasCount) return null;

  const ratingText = hasRating ? r.toFixed(1) : null;
  const countText = hasCount ? `${n.toLocaleString()} reviews` : null;

  if (ratingText && countText) return `${ratingText} • ${countText}`;
  if (ratingText) return ratingText;
  return countText;
}

export function DateHeader({
  activityLabel,
  placeLabel,
  timeRangeLine,
  coverImageUrl,
  onOpenDirections,
  placeRating,
  placeRatingsTotal,
  placeAddress,
  placeDescription,
}) {
  const activity = String(activityLabel || "").trim();
  const place = String(placeLabel || "").trim();
  const cover = String(coverImageUrl || "").trim();

  const reviewLine = formatReviewLine({
    rating: placeRating,
    ratingsTotal: placeRatingsTotal,
  });

  const address = String(placeAddress || "").trim();
  const desc = String(placeDescription || "").trim();

  const showMeta = Boolean(reviewLine || address || desc);

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#E5E5E5",
          backgroundColor: "#111",
        }}
      >
        <View style={{ height: 140 }}>
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
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: "#fff",
                }}
                numberOfLines={1}
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
                numberOfLines={1}
              >
                {place}
              </Text>
            </View>
            {timeRangeLine ? (
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.9)",
                  marginTop: 6,
                  fontWeight: "800",
                }}
              >
                {timeRangeLine}
              </Text>
            ) : null}
          </LinearGradient>
        </View>

        {showMeta ? (
          <View
            style={{
              backgroundColor: "#fff",
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderColor: "#F1F1F1",
              gap: 6,
            }}
          >
            {reviewLine ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Star size={14} color="#111" />
                <Text
                  style={{ fontSize: 12, fontWeight: "900", color: "#111" }}
                >
                  {reviewLine}
                </Text>
              </View>
            ) : null}

            {address ? (
              <Text
                style={{ fontSize: 12, color: "#6B7280" }}
                numberOfLines={1}
              >
                {address}
              </Text>
            ) : null}

            {desc ? (
              <Text
                style={{ fontSize: 12, color: "#2D2D2D" }}
                numberOfLines={2}
              >
                {desc}
              </Text>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          onPress={onOpenDirections}
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopWidth: showMeta ? 1 : 0,
            borderColor: "#F1F1F1",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "900", color: "#111" }}>
            See directions
          </Text>
          <ChevronRight size={18} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
