import { useCallback, useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { X, Image as ImageIcon, RefreshCcw, Circle } from "lucide-react-native";
import useUpload from "@/utils/useUpload";

const ACCENT = "#7C3AED";
const BG = "#000";
const MAX_SECONDS = 30;

export default function RecordVideoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef(null);
  const recordStartedAtRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const [upload, { loading: uploading, progress, bytesSent, bytesTotal }] =
    useUpload();

  useEffect(() => {
    if (!recording) {
      setRecordSeconds(0);
      recordStartedAtRef.current = null;
      return;
    }

    if (!recordStartedAtRef.current) {
      recordStartedAtRef.current = Date.now();
    }

    const t = setInterval(() => {
      const startedAt = recordStartedAtRef.current;
      if (!startedAt) return;
      const elapsedMs = Date.now() - startedAt;
      const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
      setRecordSeconds(seconds);
    }, 200);

    return () => clearInterval(t);
  }, [recording]);

  const recordTimerLabel = useMemo(() => {
    if (!recording) return null;

    const clamp = Math.max(0, Math.min(MAX_SECONDS, recordSeconds));
    const mm = String(Math.floor(clamp / 60)).padStart(2, "0");
    const ss = String(clamp % 60).padStart(2, "0");
    const totalMm = String(Math.floor(MAX_SECONDS / 60)).padStart(2, "0");
    const totalSs = String(MAX_SECONDS % 60).padStart(2, "0");
    return `${mm}:${ss} / ${totalMm}:${totalSs}`;
  }, [recordSeconds, recording]);

  const percent =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : null;

  const progressLabel = useMemo(() => {
    if (!uploading) return null;
    if (percent === null) return "Uploading…";

    const pct = Math.round(percent * 100);
    const sent =
      typeof bytesSent === "number" && Number.isFinite(bytesSent)
        ? (bytesSent / (1024 * 1024)).toFixed(1)
        : null;
    const total =
      typeof bytesTotal === "number" && Number.isFinite(bytesTotal)
        ? (bytesTotal / (1024 * 1024)).toFixed(1)
        : null;

    if (sent && total) {
      return `Uploading ${pct}% (${sent}/${total} MB)`;
    }

    return `Uploading ${pct}%`;
  }, [bytesSent, bytesTotal, percent, uploading]);

  const canInteract = !uploading;

  const ensureCameraPermission = useCallback(async () => {
    if (!permission) return false;
    if (permission.granted) return true;
    const next = await requestPermission();
    return !!next?.granted;
  }, [permission, requestPermission]);

  const validateDuration = useCallback((asset) => {
    const raw = asset?.duration;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return;

    // expo-image-picker sometimes returns ms; sometimes seconds.
    const seconds = raw > 1000 ? raw / 1000 : raw;

    if (seconds > MAX_SECONDS + 0.2) {
      throw new Error(
        `Max video length is ${MAX_SECONDS}s. Your video is about ${Math.round(seconds)}s. Please trim it and try again.`,
      );
    }
  }, []);

  const commitUploadedUrl = useCallback(
    async (url) => {
      await AsyncStorage.setItem("pending_profile_video_url", String(url));
      router.back();
    },
    [router],
  );

  const uploadAssetUri = useCallback(
    async ({ uri, fileName, mimeType }) => {
      const ext =
        typeof fileName === "string" && fileName.includes(".")
          ? fileName.split(".").pop()
          : "mp4";

      const name = fileName || `video-${Date.now()}.${ext || "mp4"}`;
      const type = mimeType || "video/mp4";

      const { url, error } = await upload({
        reactNativeAsset: {
          uri,
          name,
          mimeType: type,
          type: "video",
        },
      });

      if (error) {
        throw new Error(error);
      }

      if (!url) {
        throw new Error("Upload failed: missing URL");
      }

      await commitUploadedUrl(url);
    },
    [commitUploadedUrl, upload],
  );

  const openGallery = useCallback(async () => {
    try {
      if (!canInteract) return;

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Photos", "Please allow photo access to pick a video.");
        return;
      }

      const videoExportPresetObj = ImagePicker.VideoExportPreset;
      const IOS_EXPORT_PRESET =
        Platform.OS === "ios"
          ? videoExportPresetObj?.MediumQuality ||
            videoExportPresetObj?.HighestQuality
          : undefined;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: MAX_SECONDS,
        ...(IOS_EXPORT_PRESET ? { videoExportPreset: IOS_EXPORT_PRESET } : {}),
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      validateDuration(asset);

      if (String(asset.uri).startsWith("ph://")) {
        Alert.alert(
          "Can’t upload that video",
          "We couldn’t get a real file path from Photos. Try selecting again, or export the video to Files and pick it from there.",
        );
        return;
      }

      await uploadAssetUri({
        uri: asset.uri,
        fileName: asset.fileName || asset.name,
        mimeType: asset.mimeType,
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Video", e?.message || "Could not pick video.");
    }
  }, [canInteract, uploadAssetUri, validateDuration]);

  const toggleFacing = useCallback(() => {
    setFacing((cur) => (cur === "back" ? "front" : "back"));
  }, []);

  const onPressRecord = useCallback(async () => {
    try {
      if (!canInteract) return;

      const granted = await ensureCameraPermission();
      if (!granted) {
        Alert.alert("Camera", "Please allow camera access to record a video.");
        return;
      }

      if (!cameraRef.current) {
        Alert.alert("Camera", "Camera not ready yet.");
        return;
      }

      if (recording) {
        try {
          cameraRef.current.stopRecording();
        } catch {
          // ignore
        }
        return;
      }

      recordStartedAtRef.current = Date.now();
      setRecordSeconds(0);
      setRecording(true);

      // recordAsync resolves when stopped OR when maxDuration is reached.
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_SECONDS,
      });

      const uri = video?.uri;
      if (!uri) {
        throw new Error("Could not get recorded video.");
      }

      await uploadAssetUri({ uri, fileName: `video-${Date.now()}.mp4` });
    } catch (e) {
      console.error(e);
      Alert.alert("Video", e?.message || "Could not record video.");
    } finally {
      setRecording(false);
    }
  }, [canInteract, ensureCameraPermission, recording, uploadAssetUri]);

  const onClose = useCallback(() => {
    if (recording) {
      try {
        cameraRef.current?.stopRecording?.();
      } catch {
        // ignore
      }
    }
    router.back();
  }, [recording, router]);

  // Permission loading
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <StatusBar style="light" />
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          paddingTop: insets.top,
          paddingHorizontal: 18,
          justifyContent: "center",
        }}
      >
        <StatusBar style="light" />
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>
          Camera access
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
          We need camera permission so you can record your 30s profile video.
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          activeOpacity={0.9}
          style={{
            marginTop: 16,
            backgroundColor: "#fff",
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#111", fontWeight: "900" }}>Allow camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.9}
          style={{
            marginTop: 10,
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="light" />

      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        mode="video"
      />

      {/* Timer (top center) */}
      {recordTimerLabel ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: insets.top + 10,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.45)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.18)",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {recordTimerLabel}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Top right close */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 0,
          right: 0,
          paddingHorizontal: 14,
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.9}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.18)",
          }}
        >
          <X color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Bottom bar */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom + 18,
          paddingHorizontal: 22,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Gallery (bottom-left) */}
        <TouchableOpacity
          onPress={openGallery}
          disabled={!canInteract}
          activeOpacity={0.9}
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.14)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.18)",
            opacity: canInteract ? 1 : 0.6,
          }}
        >
          <ImageIcon color="#fff" size={22} />
        </TouchableOpacity>

        {/* Record (center) */}
        <TouchableOpacity
          onPress={onPressRecord}
          disabled={!canInteract}
          activeOpacity={0.9}
          style={{
            width: 78,
            height: 78,
            borderRadius: 39,
            backgroundColor: recording ? "#FF4FD8" : "#fff",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 4,
            borderColor: "rgba(255,255,255,0.35)",
            opacity: canInteract ? 1 : 0.6,
          }}
        >
          <Circle
            color={recording ? "#111" : ACCENT}
            fill={recording ? "#111" : ACCENT}
            size={22}
          />
        </TouchableOpacity>

        {/* Flip (bottom-right) */}
        <TouchableOpacity
          onPress={toggleFacing}
          disabled={!canInteract}
          activeOpacity={0.9}
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.14)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.18)",
            opacity: canInteract ? 1 : 0.6,
          }}
        >
          <RefreshCcw color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Upload progress (bottom) */}
      {progressLabel ? (
        <View
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: insets.bottom + 110,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 10, fontWeight: "800" }}>
              {progressLabel}
            </Text>
          </View>
          {percent !== null ? (
            <View
              style={{
                marginTop: 10,
                height: 6,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.18)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 6,
                  width: `${Math.round(percent * 100)}%`,
                  backgroundColor: ACCENT,
                }}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Small hint */}
      {!uploading ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: insets.bottom + 98,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            Max {MAX_SECONDS}s
          </Text>
        </View>
      ) : null}
    </View>
  );
}
