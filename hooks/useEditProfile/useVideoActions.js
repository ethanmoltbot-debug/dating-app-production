import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

export function useVideoActions({
  videos,
  setVideos,
  upload,
  normalizeVideoUrl,
}) {
  const formatBytes = useCallback((bytes) => {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return "";
    const mb = n / (1024 * 1024);
    if (mb < 1) {
      const kb = n / 1024;
      return `${kb.toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  }, []);

  const formatSeconds = useCallback((seconds) => {
    const n = Number(seconds);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n < 60) return `${Math.round(n)}s`;
    const m = Math.floor(n / 60);
    const s = Math.round(n % 60);
    return `${m}m ${s}s`;
  }, []);

  const getDurationSeconds = useCallback((asset) => {
    const raw = asset?.duration;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0)
      return null;
    // expo-image-picker sometimes returns ms; sometimes seconds depending on platform/runtime.
    const seconds = raw > 1000 ? raw / 1000 : raw;
    return seconds;
  }, []);

  const isLikelyTooLargeError = useCallback((msg) => {
    const s = String(msg || "").toLowerCase();
    return (
      s.includes("too large") ||
      s.includes("file too large") ||
      s.includes("413")
    );
  }, []);

  const addVideo = useCallback(async () => {
    try {
      const MAX_SECONDS = 30;

      // Only one video allowed.
      const existingCount = Array.isArray(videos) ? videos.length : 0;
      if (existingCount >= 1) {
        Alert.alert(
          "Video already added",
          "You can upload 1 video max. Remove the current one to upload a different video.",
        );
        return;
      }

      // TikTok-style uploads: optimize the video *before* uploading so the file size is sane.
      // This is the only realistic way to get uploads consistently fast on real networks.
      // IMPORTANT: LowQuality was noticeably pixelated.
      // Prefer MediumQuality (good balance). Fall back to HighestQuality if Medium isn't available.
      const videoExportPresetObj = ImagePicker.VideoExportPreset;
      const IOS_EXPORT_PRESET =
        Platform.OS === "ios"
          ? videoExportPresetObj?.MediumQuality ||
            videoExportPresetObj?.HighestQuality
          : undefined;

      const IOS_CAMERA_QUALITY =
        Platform.OS === "ios"
          ? ImagePicker.UIImagePickerControllerQualityType.High
          : undefined;

      const handlePickedVideo = async (asset) => {
        if (!asset?.uri) return;

        const durationSeconds = getDurationSeconds(asset);
        if (durationSeconds !== null && durationSeconds > MAX_SECONDS + 0.2) {
          Alert.alert(
            "Video too long",
            `Max video length is ${MAX_SECONDS}s. Your video is about ${formatSeconds(durationSeconds)}.\n\nPlease trim it and try again.`,
          );
          return;
        }

        // iOS export preset should dramatically reduce huge 4K/HDR originals.
        // When it's working, `asset.fileSize` should drop from ~200MB to something much smaller.

        // If we still somehow got a Photos reference, we can't upload it.
        // Setting videoExportPreset on iOS should usually prevent this.
        if (typeof asset.uri === "string" && asset.uri.startsWith("ph://")) {
          Alert.alert(
            "Can't upload that video",
            'We couldn\'t get a real file path from Photos. Try choosing "From Photos" again, or use "From Files".',
          );
          return;
        }

        const uri = asset.uri;
        const nameFromUri =
          typeof uri === "string" ? uri.split("/").pop() : null;
        const extRaw =
          typeof nameFromUri === "string" && nameFromUri.includes(".")
            ? nameFromUri.split(".").pop()
            : "mp4";
        const ext = String(extRaw || "mp4").toLowerCase();

        const mimeByExt = {
          mp4: "video/mp4",
          mov: "video/quicktime",
          m4v: "video/x-m4v",
          "3gp": "video/3gpp",
          "3gpp": "video/3gpp",
        };

        const mimeType = asset.mimeType || mimeByExt[ext] || "video/mp4";
        const name =
          asset.fileName || asset.name || `video-${Date.now()}.${ext}`;

        // Let the user know why we optimize.
        const sizeBytes = asset?.fileSize;
        if (Number.isFinite(sizeBytes) && sizeBytes > 120 * 1024 * 1024) {
          Alert.alert(
            "Large video",
            `This video is ${formatBytes(sizeBytes)}. Uploading a file that large can take a while depending on the connection.\n\nTip: For faster uploads, record in 1080p/HDR off in iPhone Camera settings.`,
          );
        }

        // NOTE: We allow large videos. Uploading 200MB+ can take several minutes depending on connection.
        const { url, error: uploadErr } = await upload({
          reactNativeAsset: {
            uri,
            name,
            mimeType,
            type: "video",
          },
        });

        if (uploadErr) {
          if (isLikelyTooLargeError(uploadErr)) {
            Alert.alert(
              "Upload failed",
              `That video may exceed the current upload limits for this environment.\n\nIf this keeps failing, the fastest fix is recording at 1080p/720p (iPhone Settings → Camera) or exporting a smaller copy.\n\nDetails: ${uploadErr}`,
            );
          } else {
            Alert.alert("Upload failed", uploadErr);
          }
          return;
        }

        // IMPORTANT: only 1 video allowed — store as a plain url string.
        setVideos([url]);

        // Make it explicit that the user still needs to hit Save
        Alert.alert("Video added", "Tap Save to update your profile.");
      };

      const pickFromLibrary = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Videos", "Please allow photo access to add videos.");
          return;
        }

        const options = {
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          quality: 1,
          videoMaxDuration: MAX_SECONDS,
          ...(IOS_EXPORT_PRESET
            ? { videoExportPreset: IOS_EXPORT_PRESET }
            : {}),
        };

        const result = await ImagePicker.launchImageLibraryAsync(options);

        if (result.canceled) return;
        const asset = result.assets?.[0];
        await handlePickedVideo(asset);
      };

      const recordNew = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Camera",
            "Please allow camera access to record a video.",
          );
          return;
        }

        const options = {
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          quality: 1,
          videoMaxDuration: MAX_SECONDS,
          ...(IOS_CAMERA_QUALITY ? { videoQuality: IOS_CAMERA_QUALITY } : {}),
          ...(IOS_EXPORT_PRESET
            ? { videoExportPreset: IOS_EXPORT_PRESET }
            : {}),
        };

        // Requirement: tapping "Add video" should open the camera right away.
        // iOS camera UI includes a gallery shortcut in the bottom-left.
        let result;
        try {
          result = await ImagePicker.launchCameraAsync(options);
        } catch (e) {
          console.error(e);
          Alert.alert("Camera not available", "Opening your gallery instead.");
          await pickFromLibrary();
          return;
        }

        if (result.canceled) return;
        const asset = result.assets?.[0];
        await handlePickedVideo(asset);
      };

      // Always open the camera first (with gallery option inside the camera screen).
      // If camera isn't available (common on simulators), we fall back to the photo library.
      await recordNew();
    } catch (e) {
      console.error(e);
      Alert.alert("Videos", "Could not add video.");
    }
  }, [
    formatBytes,
    formatSeconds,
    getDurationSeconds,
    isLikelyTooLargeError,
    upload,
    videos,
    setVideos,
  ]);

  const removeVideo = useCallback(
    (idx) => {
      setVideos((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next.splice(idx, 1);
        return next;
      });
    },
    [setVideos],
  );

  const setSingleVideoUrl = useCallback(
    (url) => {
      const u = normalizeVideoUrl(url);
      if (!u) return;
      setVideos([u]);
    },
    [normalizeVideoUrl, setVideos],
  );

  return {
    addVideo,
    removeVideo,
    setSingleVideoUrl,
  };
}
