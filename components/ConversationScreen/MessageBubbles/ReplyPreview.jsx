import { View, Text } from "react-native";

export function ReplyPreview({ preview, isMe }) {
  if (!preview) return null;

  const bg = isMe ? "rgba(255,255,255,0.18)" : "rgba(17,17,17,0.06)";
  const fg = isMe ? "rgba(255,255,255,0.92)" : "#111";

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{ fontSize: 12, fontWeight: "900", color: fg, marginBottom: 2 }}
        numberOfLines={1}
      >
        Replying to
      </Text>
      <Text style={{ fontSize: 12, color: fg }} numberOfLines={2}>
        {preview}
      </Text>
    </View>
  );
}
