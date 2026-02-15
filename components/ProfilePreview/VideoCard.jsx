import { useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Video as VideoIcon } from "lucide-react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Card } from "./Card";
import { MediaTopBar } from "./MediaTopBar";

export function VideoCard({ uri, badgeText, onPressMenu }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  const onPressPlay = useCallback(() => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (e) {
      console.error(e);
    }
  }, [player]);

  const playLabel = player?.playing ? "Pause" : "Play";

  return (
    <Card>
      <View style={{ height: 520, backgroundColor: "#000" }}>
        <VideoView
          player={player}
          contentFit="cover"
          nativeControls={false}
          style={{ width: "100%", height: "100%" }}
        />

        <MediaTopBar leftText={badgeText} onPressMenu={onPressMenu} />

        <View
          style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            right: 14,
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            onPress={onPressPlay}
            activeOpacity={0.85}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.55)",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <VideoIcon size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {playLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}
