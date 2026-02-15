import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ReplyPreview } from "./ReplyPreview";
import { ReactionBubble } from "./ReactionBubble";

export function TextBubble({
  message,
  isMe,
  replyPreview,
  onPress,
  onLongPress,
}) {
  const bubbleMaxWidth = "78%";

  if (isMe) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        activeOpacity={0.95}
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
              paddingVertical: 10,
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
            <Text style={{ fontSize: 15, color: "#fff", lineHeight: 20 }}>
              {message.message_text}
            </Text>
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
      activeOpacity={0.95}
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
          paddingVertical: 10,
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
        <Text style={{ fontSize: 15, color: "#111", lineHeight: 20 }}>
          {message.message_text}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
