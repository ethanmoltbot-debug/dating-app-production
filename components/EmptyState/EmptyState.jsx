import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function EmptyState({
  onRefresh,
  topInset,
  refreshing = false,
  variant,
  title,
  subtitle,
  hideEmoji,
}) {
  const buttonText = refreshing ? "Refreshing..." : "Refresh";
  const buttonOpacity = refreshing ? 0.7 : 1;
  const isDark = variant === "dark";

  // In the new app look (pastel gradients), we want the background to be transparent
  // so the screen's gradient can show through.
  const bg = isDark ? "#0B0B10" : "transparent";
  const titleColor = isDark ? "#fff" : "#2D2D2D";
  const subtitleColor = isDark ? "#A1A1AA" : "#666";

  const buttonGradient = isDark
    ? ["#FF4FD8", "#7C3AED"]
    : ["#FF4FD8", "#7C3AED"]; // pink -> purple

  const displayTitle = title || "No More Profiles";
  const displaySubtitle = subtitle || "Check back later for new matches";

  const showEmoji = !hideEmoji && !isDark;
  const emojiText = showEmoji ? "😊" : "";

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        paddingTop: topInset + 80,
        backgroundColor: bg,
      }}
    >
      <Text style={{ fontSize: 32, marginBottom: 16 }}>{emojiText}</Text>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "600",
          color: titleColor,
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        {displayTitle}
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: subtitleColor,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        {displaySubtitle}
      </Text>
      <TouchableOpacity
        onPress={onRefresh}
        disabled={refreshing}
        style={{
          borderRadius: 24,
          overflow: "hidden",
          opacity: buttonOpacity,
        }}
      >
        <LinearGradient
          colors={buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 14, paddingHorizontal: 32 }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
            {buttonText}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
