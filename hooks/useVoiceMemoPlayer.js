import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioPlayer } from "expo-audio";

export function useVoiceMemoPlayer() {
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const playerRef = useRef(null);

  const stopPlayer = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.pause();
      p.remove();
    } catch (e) {
      console.error(e);
    } finally {
      playerRef.current = null;
      setPlayingMessageId(null);
    }
  }, []);

  const togglePlayVoiceMemo = useCallback(
    (message) => {
      const url = String(message?.audio_url || "").trim();
      if (!url) return;

      const id = message?.id;
      if (playingMessageId && id === playingMessageId) {
        stopPlayer();
        return;
      }

      stopPlayer();

      try {
        const next = createAudioPlayer(url);
        playerRef.current = next;
        setPlayingMessageId(id);
        next.play();
      } catch (e) {
        console.error(e);
      }
    },
    [playingMessageId, stopPlayer],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;

      const finished = !p.playing && Number(p.currentTime) > 0;
      if (finished) {
        stopPlayer();
      }
    }, 250);

    return () => {
      clearInterval(interval);
      stopPlayer();
    };
  }, [stopPlayer]);

  return {
    playingMessageId,
    togglePlayVoiceMemo,
  };
}
