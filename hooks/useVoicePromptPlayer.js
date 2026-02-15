import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { createAudioPlayer } from "expo-audio";

export function useVoicePromptPlayer(voicePromptAudioUrl) {
  const [voicePromptPlayer, setVoicePromptPlayer] = useState(null);
  const [voicePromptPlaying, setVoicePromptPlaying] = useState(false);

  useEffect(() => {
    return () => {
      try {
        if (voicePromptPlayer) {
          voicePromptPlayer.pause();
          voicePromptPlayer.remove();
        }
      } catch {
        // ignore
      }
    };
  }, [voicePromptPlayer]);

  useEffect(() => {
    if (!voicePromptPlayer) return;
    const t = setInterval(() => {
      try {
        setVoicePromptPlaying(!!voicePromptPlayer.playing);
      } catch {
        // ignore
      }
    }, 250);

    return () => clearInterval(t);
  }, [voicePromptPlayer]);

  const onToggleVoicePrompt = useCallback(() => {
    try {
      if (!voicePromptAudioUrl) {
        Alert.alert("Voice prompt", "You haven't added a voice prompt yet.");
        return;
      }

      if (!voicePromptPlayer) {
        const next = createAudioPlayer(voicePromptAudioUrl);
        setVoicePromptPlayer(next);
        next.play();
        setVoicePromptPlaying(true);
        return;
      }

      if (voicePromptPlayer.playing) {
        voicePromptPlayer.pause();
        setVoicePromptPlaying(false);
      } else {
        voicePromptPlayer.play();
        setVoicePromptPlaying(true);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Voice prompt", "Could not play your voice prompt.");
    }
  }, [voicePromptAudioUrl, voicePromptPlayer]);

  return {
    voicePromptPlaying,
    onToggleVoicePrompt,
  };
}
