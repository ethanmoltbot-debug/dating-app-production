import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Alert, Platform } from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";

export function useVoiceRecording({ upload, setVoicePrompt }) {
  const MAX_VOICE_SECONDS = 30;

  const recorderOptions = useMemo(
    () => ({
      ...RecordingPresets.HIGH_QUALITY,
      // Enables metering so we can render a live waveform while recording.
      isMeteringEnabled: true,
    }),
    [],
  );

  const recorder = useAudioRecorder(recorderOptions);
  // NOTE: useAudioRecorderState updates are not always frequent enough for a
  // “live” waveform + timer, so we’ll do our own lightweight polling below.
  const recorderState = useAudioRecorderState(recorder);

  const [recordingBusy, setRecordingBusy] = useState(false);

  // NEW: track recording for UI ourselves (recorderState.isRecording is not reliable for live UI)
  const [isRecordingUi, setIsRecordingUi] = useState(false);

  const autoStopTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const isRecordingRef = useRef(false);
  const startedAtMsRef = useRef(null); // fallback timer when currentTime doesn't tick

  // Live recording UI (timer + waveform)
  const [voiceRecordingTime, setVoiceRecordingTime] = useState(0);
  const [voiceWaveformLive, setVoiceWaveformLive] = useState([]);
  const voiceSamplesRef = useRef([]);

  const normalizeMetering = useCallback((metering) => {
    // metering is usually a negative dB value (ex: -60 .. 0).
    const m = Number(metering);
    if (!Number.isFinite(m)) return null;
    const clamped = Math.max(-60, Math.min(0, m));
    const linear = (clamped + 60) / 60; // 0..1
    // Light curve so quiet speech still shows up.
    return Math.pow(linear, 0.65);
  }, []);

  const downsampleWaveform = useCallback((samples, targetCount) => {
    const src = Array.isArray(samples) ? samples : [];
    const n = Math.max(1, Number(targetCount) || 60);

    if (src.length === 0) {
      // Keep a stable shape while recording starts.
      return new Array(n).fill(0);
    }

    if (src.length <= n) {
      // pad to a consistent length
      const padded = [...src];
      while (padded.length < n) padded.push(0);
      return padded.slice(0, n);
    }

    const bucketSize = src.length / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      const start = Math.floor(i * bucketSize);
      const end = Math.floor((i + 1) * bucketSize);
      const slice = src.slice(start, Math.max(start + 1, end));
      const avg =
        slice.reduce((sum, v) => sum + (Number(v) || 0), 0) / slice.length;
      out.push(Math.max(0, Math.min(1, avg)));
    }
    return out;
  }, []);

  // NEW: polling start/stop helpers so timer + waveform update even if recorderState doesn't
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();

    let inFlight = false;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        // 1) time: prefer recorder.getStatus().currentTime; fallback to wall-clock
        let seconds = 0;

        try {
          const status = await recorder.getStatus();
          const statusTime = Number(status?.currentTime);
          if (Number.isFinite(statusTime)) {
            seconds = statusTime;
          }
        } catch {
          // ignore
        }

        if (!seconds && startedAtMsRef.current) {
          seconds = (Date.now() - startedAtMsRef.current) / 1000;
        }

        seconds = Math.max(0, Math.min(MAX_VOICE_SECONDS, seconds));
        setVoiceRecordingTime(seconds);

        // 2) metering: prefer status.metering, then recorderState.metering
        let meteringValue = recorderState?.metering;
        try {
          const status = await recorder.getStatus();
          if (typeof status?.metering !== "undefined") {
            meteringValue = status.metering;
          }
        } catch {
          // ignore
        }

        const normalized = normalizeMetering(meteringValue);
        // If metering isn't exposed on a device/build, still animate gently so the user
        // sees that we are recording.
        const amp =
          typeof normalized === "number"
            ? normalized
            : 0.05 + Math.random() * 0.06;

        voiceSamplesRef.current = [...voiceSamplesRef.current, amp].slice(-600);
        setVoiceWaveformLive(downsampleWaveform(voiceSamplesRef.current, 60));
      } finally {
        inFlight = false;
      }
    };

    // Run immediately and then poll.
    tick();
    pollIntervalRef.current = setInterval(tick, 100);
  }, [
    MAX_VOICE_SECONDS,
    downsampleWaveform,
    normalizeMetering,
    recorder,
    recorderState?.metering,
    stopPolling,
  ]);

  const clearAutoStop = useCallback(() => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }, []);

  const finalizeRecordingAndUpload = useCallback(async () => {
    // revert audio mode so playback routes normally again
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch (e) {
      console.error(e);
    }

    const localUri = recorder.uri;
    if (!localUri) {
      Alert.alert("Voice prompt", "Could not get recording file.");
      return;
    }

    const extRaw =
      typeof localUri === "string" && localUri.includes(".")
        ? localUri.split(".").pop()
        : "m4a";
    const ext = String(extRaw || "m4a").toLowerCase();
    const name = `voice-${Date.now()}.${ext}`;

    const mimeByExt = {
      m4a: "audio/m4a",
      mp4: "audio/mp4",
      wav: "audio/wav",
      caf: "audio/x-caf",
      "3gp": "audio/3gpp",
      "3gpp": "audio/3gpp",
    };
    const mimeType = mimeByExt[ext] || "application/octet-stream";

    const waveformFinal = downsampleWaveform(voiceSamplesRef.current, 60);

    const { url, error: uploadErr } = await upload({
      reactNativeAsset: {
        uri: localUri,
        name,
        mimeType,
        type: "audio",
      },
    });

    if (uploadErr) {
      Alert.alert("Upload failed", uploadErr);
      return;
    }

    setVoicePrompt((prev) => ({
      ...prev,
      audioUrl: url,
      fileName: name,
      waveform: waveformFinal,
    }));

    Alert.alert("Saved", "Voice prompt added.");
  }, [downsampleWaveform, recorder.uri, setVoicePrompt, upload]);

  const toggleRecordingVoicePrompt = useCallback(async () => {
    try {
      if (recordingBusy) return;
      setRecordingBusy(true);

      if (Platform.OS === "web") {
        Alert.alert("Voice prompt", "Recording isn’t supported on web.");
        return;
      }

      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Microphone",
          "Please allow microphone access to record a voice prompt.",
        );
        return;
      }

      // IMPORTANT: expo-audio requires enabling recording mode or iOS can silently fail.
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch (e) {
        console.error(e);
      }

      if (isRecordingRef.current) {
        // Stop recording and upload
        clearAutoStop();
        stopPolling();
        setIsRecordingUi(false);

        try {
          await recorder.stop();
        } catch (e) {
          console.error(e);
        }

        isRecordingRef.current = false;
        startedAtMsRef.current = null;

        await finalizeRecordingAndUpload();
      } else {
        // starting a new recording
        clearAutoStop();
        voiceSamplesRef.current = [];
        setVoiceRecordingTime(0);
        setVoiceWaveformLive(new Array(60).fill(0));

        await recorder.prepareToRecordAsync();
        recorder.record();

        // Immediately reflect recording in UI (do not wait for recorderState)
        isRecordingRef.current = true;
        setIsRecordingUi(true);
        startedAtMsRef.current = Date.now();
        startPolling();

        // Auto-stop at 30 seconds
        autoStopTimeoutRef.current = setTimeout(async () => {
          try {
            if (isRecordingRef.current) {
              stopPolling();
              setIsRecordingUi(false);
              await recorder.stop();
              isRecordingRef.current = false;
              await finalizeRecordingAndUpload();
            }
          } catch (e) {
            console.error(e);
          } finally {
            clearAutoStop();
          }
        }, MAX_VOICE_SECONDS * 1000);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Voice prompt",
        e?.message || "Could not record voice prompt.",
      );
    } finally {
      setRecordingBusy(false);
    }
  }, [
    MAX_VOICE_SECONDS,
    clearAutoStop,
    finalizeRecordingAndUpload,
    recorder,
    recordingBusy,
    startPolling,
    stopPolling,
  ]);

  useEffect(() => {
    return () => {
      clearAutoStop();
      stopPolling();
    };
  }, [clearAutoStop, stopPolling]);

  return {
    recorderState,
    recordingBusy,
    isRecordingUi,
    voiceRecordingTime,
    voiceWaveformLive,
    toggleRecordingVoicePrompt,
  };
}
