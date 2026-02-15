import { View, Text, TouchableOpacity } from "react-native";

export function QueuedMatchesCard({
  queuedCount = 0,
  onPressOpenChat,
  // NEW: allow this same card style to be used for "Match pending"
  title,
  subtitle,
  buttonLabel,
}) {
  const n = Number(queuedCount);
  const count = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;

  if (count <= 0) {
    return null;
  }

  const defaultTitle = `You have ${count} match${count === 1 ? "" : "es"} waiting`;
  const titleText =
    typeof title === "string" && title.trim() ? title.trim() : defaultTitle;

  const defaultSubtitle = "Finish this path to unlock the next.";
  const subtitleText =
    typeof subtitle === "string" && subtitle.trim()
      ? subtitle.trim()
      : defaultSubtitle;

  const buttonText =
    typeof buttonLabel === "string" && buttonLabel.trim()
      ? buttonLabel.trim()
      : "Open current chat";

  return (
    <View
      style={{
        marginTop: 12,
        backgroundColor: "rgba(255,255,255,0.76)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
        {titleText}
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
        {subtitleText}
      </Text>

      {onPressOpenChat ? (
        <TouchableOpacity
          onPress={onPressOpenChat}
          activeOpacity={0.9}
          style={{
            marginTop: 12,
            alignSelf: "flex-start",
            backgroundColor: "rgba(124, 58, 237, 0.10)",
            borderWidth: 1,
            borderColor: "rgba(124, 58, 237, 0.18)",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 14,
          }}
        >
          <Text style={{ fontWeight: "900", color: "#111" }}>{buttonText}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ flexDirection: "row", marginTop: 14 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={`queue-ph-${i}`}
            style={{
              width: 58,
              height: 72,
              borderRadius: 16,
              backgroundColor: "rgba(17,17,17,0.06)",
              marginRight: i === 2 ? 0 : 10,
            }}
          />
        ))}
      </View>
    </View>
  );
}
