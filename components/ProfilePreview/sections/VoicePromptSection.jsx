import { View, Text, TouchableOpacity } from "react-native";
import { Play, Pause } from "lucide-react-native";
import { Card } from "../Card";
import { SectionHeader } from "../SectionHeader";
import { THEME, ACCENT } from "../theme";

export function VoicePromptSection({
  voicePrompt,
  voicePromptPlaying,
  onToggleVoicePrompt,
}) {
  const hasVoice = !!voicePrompt?.audioUrl;
  if (!hasVoice) {
    return null;
  }

  const voiceBtnBg = ACCENT;
  const voiceBtnColor = "#fff";
  const voiceLabel = voicePromptPlaying ? "Pause" : "Play";

  return (
    <Card style={{ padding: 16 }}>
      <SectionHeader title="Voice prompt" />
      {voicePrompt?.question ? (
        <Text style={{ color: THEME.muted, marginTop: 10 }}>
          {voicePrompt.question}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={onToggleVoicePrompt}
        activeOpacity={0.85}
        style={{
          marginTop: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          borderRadius: 14,
          paddingVertical: 12,
          backgroundColor: voiceBtnBg,
        }}
      >
        {voicePromptPlaying ? (
          <Pause size={18} color={voiceBtnColor} />
        ) : (
          <Play size={18} color={voiceBtnColor} />
        )}
        <Text style={{ color: voiceBtnColor, fontWeight: "900" }}>
          {voiceLabel}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}
