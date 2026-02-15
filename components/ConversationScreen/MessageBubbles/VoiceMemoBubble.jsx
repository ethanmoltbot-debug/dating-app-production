import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pause, Play, Volume2 } from "lucide-react-native";
import { ReplyPreview } from "./ReplyPreview";
import { ReactionBubble } from "./ReactionBubble";
import { formatDurationMs } from "@/utils/messageHelpers";

export function VoiceMemoBubble({
  message,
  isMe,
  isPlaying,
  replyPreview,
  onPress,
  onLongPress,
}) {
  const durationLabel = formatDurationMs(message?.audio_duration_ms);
  const bubbleMaxWidth = "78%";

  const icon = isPlaying ? (
    <Pause size={18} color={isMe ? "#fff" : "#111"} />
  ) : (
    <Play size={18} color={isMe ? "#fff" : "#111"} />
  );

  const voiceInner = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isMe
            ? "rgba(255,255,255,0.18)"
            : "rgba(17,17,17,0.06)",
        }}
      >
        {icon}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Volume2 size={14} color={isMe ? "rgba(255,255,255,0.9)" : "#111"} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "900",
              color: isMe ? "#fff" : "#111",
            }}
          >
            Voice memo
          </Text>
        </View>

        <Text
          style={{
            fontSize: 12,
            marginTop: 4,
            color: isMe ? "rgba(255,255,255,0.85)" : "#6B7280",
          }}
        >
          {durationLabel}
        </Text>
      </View>
    </View>
  );

  if (isMe) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        activeOpacity={0.9}
        style={{
          alignSelf: "flex-end",
          maxWidth: bubbleMaxWidth,
          marginBottom: 0,
          flexShrink: 1,
        }}
      >
        <View style={{ position: "relative" }}>
          <LinearGradient
            colors={["#FF4FD8", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.12,
              shadowRadius: 3,
              position: "relative",
            }}
          >
            <ReplyPreview preview={replyPreview} isMe={true} />
            {voiceInner}
          </LinearGradient>

          {/* Tinder-style: show the small filled heart *outside* your bubble when they liked it */}
          <ReactionBubble message={message} isMe={true} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      activeOpacity={0.9}
      style={{
        alignSelf: "flex-start",
        maxWidth: bubbleMaxWidth,
        marginBottom: 0,
        flexShrink: 1,
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          position: "relative",
        }}
      >
        <ReplyPreview preview={replyPreview} isMe={false} />
        {voiceInner}
      </View>
    </TouchableOpacity>
  );
}
