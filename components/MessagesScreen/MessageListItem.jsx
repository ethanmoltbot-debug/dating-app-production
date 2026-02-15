import { View, Text, TouchableOpacity, Image } from "react-native";
import { formatTime, shouldShowStarterPreview } from "@/utils/messagesHelpers";

function getFirstPhotoUrl(photos) {
  // photos can be: string[] | JSON-stringified string[] | null
  try {
    if (Array.isArray(photos)) {
      const first = photos.find((p) => typeof p === "string" && p.length > 0);
      return first || null;
    }

    if (typeof photos === "string") {
      const trimmed = photos.trim();

      // If it's already a url, use it.
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }

      // If it's a JSON array, parse it.
      if (trimmed.startsWith("[")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const first = parsed.find(
            (p) => typeof p === "string" && p.length > 0,
          );
          return first || null;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function MessageListItem({ match, onPress, firstMatchRef }) {
  const matchIdValue = match?.match_id != null ? String(match.match_id) : "";

  const name =
    typeof match?.display_name === "string" && match.display_name.trim()
      ? match.display_name.trim()
      : "Chat";

  const photoUri =
    getFirstPhotoUrl(match?.photos) || "https://via.placeholder.com/60";

  const showStarter = shouldShowStarterPreview(match);
  const starterSummaryText =
    typeof match?.starter_summary === "string"
      ? match.starter_summary.trim()
      : "";
  const startChatLineText =
    typeof match?.start_chat_line === "string"
      ? match.start_chat_line.trim()
      : "";

  const isOnline = Boolean(match?.is_online);
  const dotColor = isOnline ? "#22C55E" : "#9CA3AF";

  const fallbackPreview = match.last_message || "Say hi! 👋";
  const previewLine1 = showStarter ? starterSummaryText : null;
  const previewLine2 = showStarter
    ? startChatLineText || fallbackPreview
    : fallbackPreview;

  const unreadCount = Math.max(0, Number(match?.unread_count || 0));
  // NOTE: Pre-chat “new message” should look the same as the rest of the app (pink dot),
  // not a red alert icon.

  const handlePress = () => {
    if (!matchIdValue) return;
    onPress(match);
  };

  return (
    <TouchableOpacity
      ref={firstMatchRef}
      onPress={handlePress}
      activeOpacity={0.9}
      style={{ marginBottom: 12 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          backgroundColor: "rgba(255,255,255,0.86)",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
        }}
      >
        <View style={{ marginRight: 14 }}>
          <View style={{ position: "relative" }}>
            <Image
              source={{
                uri: photoUri,
              }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: dotColor,
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.95)",
              }}
            />
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: "#111",
                flex: 1,
                marginRight: 10,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>

            {match.last_message_time ? (
              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                {formatTime(match.last_message_time)}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              {previewLine1 ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                    fontWeight: "800",
                  }}
                  numberOfLines={1}
                >
                  {previewLine1}
                </Text>
              ) : null}

              <Text
                style={{
                  marginTop: previewLine1 ? 2 : 0,
                  fontSize: 13,
                  color: unreadCount > 0 || showStarter ? "#111" : "#6B7280",
                  fontWeight: unreadCount > 0 || showStarter ? "800" : "500",
                }}
                numberOfLines={1}
              >
                {previewLine2}
              </Text>
            </View>

            {unreadCount > 0 ? (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "#FF4FD8",
                  marginLeft: 10,
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.86)",
                }}
              />
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
