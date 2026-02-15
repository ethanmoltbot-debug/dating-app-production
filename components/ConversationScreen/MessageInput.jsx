import { useCallback, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Keyboard,
} from "react-native";
import { Mic, Send, Square, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

function formatDuration(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const total = Math.floor(s);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getReplyLabel(replyTo) {
  if (!replyTo) return null;
  const type = String(replyTo?.message_type || "TEXT").toUpperCase();
  if (type === "AUDIO" || replyTo?.audio_url) return "Voice memo";

  const text = String(replyTo?.message_text || "").trim();
  if (!text) return "Message";
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

export function MessageInput({
  insets,
  inputText,
  setInputText,
  sending,
  sendMessage,
  voiceSending,
  sendVoiceMemo,
  replyTo,
  onCancelReply,
}) {
  const [voiceError, setVoiceError] = useState(null);

  const inputRef = useRef(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const canSendText = Boolean(inputText && String(inputText).trim());
  const isRecording = Boolean(recorderState?.isRecording);

  const replyLabel = useMemo(() => {
    return getReplyLabel(replyTo);
  }, [replyTo]);

  const sendColors = canSendText
    ? ["#FF4FD8", "#7C3AED"]
    : ["#E5E7EB", "#E5E7EB"];

  const recordTimeLabel = useMemo(() => {
    return formatDuration(recorderState?.currentTime || 0);
  }, [recorderState?.currentTime]);

  const startRecording = useCallback(async () => {
    if (Platform.OS === "web") {
      setVoiceError("Voice memos aren’t supported on web.");
      return;
    }

    setVoiceError(null);
    const perm = await requestRecordingPermissionsAsync();
    if (!perm?.granted) {
      setVoiceError("Microphone permission is required.");
      return;
    }

    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [recorder]);

  const stopAndSendRecording = useCallback(async () => {
    try {
      setVoiceError(null);

      // capture duration before stopping (some runtimes reset currentTime on stop)
      const seconds = Number(recorderState?.currentTime || 0);

      await recorder.stop();

      const uri = recorder?.uri;
      if (!uri) {
        setVoiceError("Could not find the recorded file.");
        return;
      }

      const durationMs = Math.max(0, Math.round(seconds * 1000));

      await sendVoiceMemo?.({ uri, durationMs });
    } catch (e) {
      console.error(e);
      setVoiceError("Could not record that. Please try again.");
    }
  }, [recorder, recorderState?.currentTime, sendVoiceMemo]);

  const cancelRecording = useCallback(async () => {
    try {
      setVoiceError(null);
      if (recorderState?.isRecording) {
        await recorder.stop();
      }
    } catch (e) {
      console.error(e);
    }
  }, [recorder, recorderState?.isRecording]);

  const onPressMic = useCallback(async () => {
    // If they start recording while typing, hide the keyboard.
    Keyboard.dismiss();

    if (voiceSending) return;
    if (isRecording) {
      await stopAndSendRecording();
      return;
    }
    await startRecording();
  }, [isRecording, startRecording, stopAndSendRecording, voiceSending]);

  const onPressSend = useCallback(async () => {
    if (!canSendText || sending || isRecording) {
      return;
    }

    try {
      await sendMessage?.();
    } finally {
      // Always hide the keyboard after pressing send.
      Keyboard.dismiss();
      inputRef.current?.blur?.();
    }
  }, [canSendText, isRecording, sending, sendMessage]);

  const micBg = isRecording ? "#FF1744" : "rgba(17,17,17,0.06)";
  const micBorder = isRecording ? "rgba(255,23,68,0.3)" : "rgba(17,17,17,0.06)";

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: insets.bottom + 10,
        backgroundColor: "transparent",
      }}
    >
      {replyLabel && !isRecording ? (
        <View
          style={{
            marginBottom: 8,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "rgba(255,255,255,0.8)",
            borderWidth: 1,
            borderColor: "rgba(124, 58, 237, 0.22)",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 14,
            maxWidth: "100%",
          }}
        >
          <View
            style={{
              width: 3,
              alignSelf: "stretch",
              borderRadius: 999,
              backgroundColor: "#7C3AED",
            }}
          />

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
              Replying
            </Text>
            <Text
              style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
              numberOfLines={2}
            >
              {replyLabel}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onCancelReply}
            activeOpacity={0.85}
            style={{ marginLeft: 2 }}
          >
            <X size={16} color="#111" />
          </TouchableOpacity>
        </View>
      ) : null}

      {isRecording ? (
        <View
          style={{
            marginBottom: 8,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "rgba(255,255,255,0.8)",
            borderWidth: 1,
            borderColor: "rgba(255,23,68,0.18)",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: "#FF1744",
            }}
          />
          <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
            Recording {recordTimeLabel}
          </Text>

          <TouchableOpacity
            onPress={cancelRecording}
            activeOpacity={0.85}
            style={{ marginLeft: 2 }}
          >
            <X size={16} color="#111" />
          </TouchableOpacity>
        </View>
      ) : null}

      {voiceError ? (
        <Text style={{ color: "#B00020", fontSize: 12, marginBottom: 8 }}>
          {voiceError}
        </Text>
      ) : null}

      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 18,
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
        }}
      >
        <TouchableOpacity
          onPress={onPressMic}
          disabled={voiceSending}
          activeOpacity={0.9}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: micBg,
            borderWidth: 1,
            borderColor: micBorder,
          }}
        >
          {voiceSending ? (
            <ActivityIndicator
              size="small"
              color={isRecording ? "#fff" : "#111"}
            />
          ) : isRecording ? (
            <Square size={18} color="#fff" />
          ) : (
            <Mic size={20} color="#111" />
          )}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            isRecording
              ? "Recording…"
              : replyLabel
                ? "Reply…"
                : "Type a message…"
          }
          placeholderTextColor="#8B8B95"
          editable={!isRecording}
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.7)",
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 15,
            color: "#111",
            maxHeight: 120,
            opacity: isRecording ? 0.6 : 1,
          }}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          onPress={onPressSend}
          disabled={!canSendText || sending || isRecording}
          activeOpacity={0.9}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            overflow: "hidden",
            opacity: isRecording ? 0.6 : 1,
          }}
        >
          <LinearGradient
            colors={sendColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
