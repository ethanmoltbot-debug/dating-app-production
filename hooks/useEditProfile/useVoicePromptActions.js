import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { createAudioPlayer } from "expo-audio";

export function useVoicePromptActions({ voicePrompt, setVoicePrompt, upload }) {
  const [voicePlayer, setVoicePlayer] = useState(null);
  const [voicePlaying, setVoicePlaying] = useState(false);

  // Playback UI (for waveform highlighting)
  const [voicePlaybackTime, setVoicePlaybackTime] = useState(0);
  const [voicePlaybackDuration, setVoicePlaybackDuration] = useState(0);

  useEffect(() => {
    return () => {
      try {
        if (voicePlayer) {
          voicePlayer.pause();
          voicePlayer.remove();
        }
      } catch (e) {
        // no-op
      }
    };
  }, [voicePlayer]);

  const stopAndCleanupPlayer = useCallback(() => {
    try {
      if (voicePlayer) {
        voicePlayer.pause();
        voicePlayer.remove();
      }
    } catch (e) {
      // ignore
    }
    setVoicePlayer(null);
    setVoicePlaying(false);
    setVoicePlaybackTime(0);
    setVoicePlaybackDuration(0);
  }, [voicePlayer]);

  const pickVoiceAudioFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert("Voice prompt", "No file selected.");
        return;
      }

      const uploadAsset = {
        uri: asset.uri,
        name: asset.name || `voice-${Date.now()}.m4a`,
        mimeType: asset.mimeType || "audio/m4a",
        type: "audio",
      };

      const { url, error: uploadErr } = await upload({
        reactNativeAsset: uploadAsset,
      });

      if (uploadErr) {
        Alert.alert("Upload failed", uploadErr);
        return;
      }

      stopAndCleanupPlayer();
      setVoicePrompt((prev) => ({
        ...prev,
        audioUrl: url,
        fileName: uploadAsset.name || "voice-prompt",
      }));
    } catch (e) {
      console.error(e);
      Alert.alert("Voice prompt", "Could not attach audio.");
    }
  }, [stopAndCleanupPlayer, upload, setVoicePrompt]);

  const togglePlayVoicePrompt = useCallback(() => {
    try {
      const src = voicePrompt.audioUrl;
      if (!src) return;

      // If no player yet, create and play
      if (!voicePlayer) {
        const next = createAudioPlayer(src);
        setVoicePlayer(next);
        next.play();
        setVoicePlaying(true);
        return;
      }

      if (voicePlayer.playing) {
        voicePlayer.pause();
        setVoicePlaying(false);
      } else {
        voicePlayer.play();
        setVoicePlaying(true);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Voice prompt", "Could not play audio.");
    }
  }, [voicePlayer, voicePrompt.audioUrl]);

  // Keep playback timer in sync so we can highlight the waveform while playing.
  useEffect(() => {
    if (!voicePlayer) {
      setVoicePlaybackTime(0);
      setVoicePlaybackDuration(0);
      return;
    }

    const t = setInterval(() => {
      try {
        const ct = Number(voicePlayer.currentTime);
        const dur = Number(voicePlayer.duration);
        setVoicePlaybackTime(Number.isFinite(ct) ? ct : 0);
        setVoicePlaybackDuration(Number.isFinite(dur) ? dur : 0);

        const playing = !!voicePlayer.playing;
        setVoicePlaying(playing);
      } catch {
        // ignore
      }
    }, 120);

    return () => clearInterval(t);
  }, [voicePlayer]);

  const removeVoiceAudio = useCallback(() => {
    stopAndCleanupPlayer();
    setVoicePrompt((prev) => ({
      ...prev,
      audioUrl: "",
      fileName: "",
      waveform: [],
    }));
  }, [stopAndCleanupPlayer, setVoicePrompt]);

  return {
    voicePlaying,
    voicePlaybackTime,
    voicePlaybackDuration,
    pickVoiceAudioFile,
    togglePlayVoicePrompt,
    removeVoiceAudio,
    stopAndCleanupPlayer,
  };
}
