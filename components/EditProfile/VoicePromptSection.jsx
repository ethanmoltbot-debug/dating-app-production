import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useMemo } from "react";
import {
  ChevronRight,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
} from "lucide-react-native";
import { Section } from "./Section";

const ACCENT = "#7C3AED";

function formatClock(seconds) {
  const n = Number(seconds);
  const safe = Number.isFinite(n) && n > 0 ? n : 0;
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function WaveformBars({ values, progress }) {
  const bars = Array.isArray(values) ? values : [];
  const count = bars.length;
  const safeProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : null;

  const activeCount =
    safeProgress === null ? 0 : Math.floor(safeProgress * count);

  // Precompute sizes so JSX is simple.
  const maxHeight = 34;
  const minHeight = 4;
  const barWidth = 2;
  const barGap = 2;

  return (
    <View
      style={{
        height: maxHeight,
        flexDirection: "row",
        alignItems: "flex-end",
        overflow: "hidden",
      }}
    >
      {bars.map((v, i) => {
        const nv = Number(v);
        const vv = Number.isFinite(nv) ? Math.max(0, Math.min(1, nv)) : 0;
        const h = Math.max(
          minHeight,
          Math.round(minHeight + vv * (maxHeight - minHeight)),
        );
        const isActive = i < activeCount;
        const bg = isActive ? ACCENT : "#D1D5DB";

        return (
          <View
            key={`bar-${i}`}
            style={{
              width: barWidth,
              height: h,
              marginRight: i === count - 1 ? 0 : barGap,
              borderRadius: 999,
              backgroundColor: bg,
              opacity: isActive ? 1 : 0.55,
            }}
          />
        );
      })}
    </View>
  );
}

export function VoicePromptSection({
  voicePrompt,
  isRecording,
  recordingTime,
  waveform,
  playbackTime,
  playbackDuration,
  recordingBusy,
  voicePlaying,
  onSelectQuestion,
  onToggleRecording,
  onTogglePlay,
  onRemoveAudio,
}) {
  const MAX_SECONDS = 30;
  const safeWaveform = useMemo(() => {
    const arr = Array.isArray(waveform) ? waveform : [];
    if (arr.length > 0) return arr;

    // While recording, we want the waveform area to be "live" (not a static placeholder).
    // Start from silence and let real samples fill in.
    if (isRecording) {
      return new Array(60).fill(0);
    }

    // Nice-looking placeholder when metering isn't available yet / no audio recorded
    return new Array(60).fill(0).map((_, i) => (i % 7 === 0 ? 0.35 : 0.12));
  }, [isRecording, waveform]);

  const recSeconds = Number(recordingTime) || 0;
  const recProgress = Math.max(0, Math.min(1, recSeconds / MAX_SECONDS));

  const dur = Number(playbackDuration) || 0;
  const playSeconds = Number(playbackTime) || 0;
  const playProgress =
    dur > 0 ? Math.max(0, Math.min(1, playSeconds / dur)) : 0;

  const recordingClock = `${formatClock(recSeconds)} / ${formatClock(MAX_SECONDS)}`;
  const playbackClock =
    dur > 0
      ? `${formatClock(playSeconds)} / ${formatClock(dur)}`
      : formatClock(playSeconds);

  return (
    <Section
      title="Voice prompt"
      subtitle="Say it in your own voice. A short note can go a long way."
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#E5E5EA",
          padding: 14,
        }}
      >
        <TouchableOpacity
          onPress={onSelectQuestion}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: "#9CA3AF" }}>Question</Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 15,
                fontWeight: "600",
                color: "#111",
              }}
            >
              {voicePrompt.question || "Pick a voice prompt"}
            </Text>
          </View>
          <ChevronRight size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <View style={{ height: 12 }} />

        {voicePrompt.audioUrl ? (
          <View
            style={{
              borderRadius: 14,
              backgroundColor: "#FAFAFA",
              borderWidth: 1,
              borderColor: "#F0F0F0",
              padding: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={onTogglePlay}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                {voicePlaying ? (
                  <Pause size={18} color={ACCENT} />
                ) : (
                  <Play size={18} color={ACCENT} />
                )}
                <Text style={{ color: "#111", flex: 1 }} numberOfLines={1}>
                  {voicePrompt.fileName || "Voice prompt"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onRemoveAudio} style={{ padding: 6 }}>
                <Trash2 size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 10 }} />

            <WaveformBars values={safeWaveform} progress={playProgress} />

            <View style={{ height: 8 }} />
            <Text style={{ color: "#6B7280", fontSize: 12 }}>
              {playbackClock}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={onToggleRecording}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                backgroundColor: isRecording ? "#111" : "#F3E8FF",
                borderWidth: 1,
                borderColor: isRecording ? "#111" : "#D8B4FE",
                borderRadius: 14,
                paddingVertical: 12,
              }}
              disabled={recordingBusy}
            >
              {recordingBusy ? (
                <ActivityIndicator
                  size="small"
                  color={isRecording ? "#fff" : ACCENT}
                />
              ) : isRecording ? (
                <Square size={18} color="#fff" />
              ) : (
                <Mic size={18} color={ACCENT} />
              )}
              <Text
                style={{
                  fontWeight: "600",
                  color: isRecording ? "#fff" : ACCENT,
                }}
              >
                {isRecording ? "Stop recording" : "Record voice prompt"}
              </Text>
            </TouchableOpacity>

            {isRecording ? (
              <View style={{ alignItems: "center" }}>
                <WaveformBars values={safeWaveform} progress={recProgress} />
                <View style={{ height: 8 }} />
                <Text style={{ color: "#6B7280", textAlign: "center" }}>
                  Recording… {recordingClock}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Section>
  );
}
