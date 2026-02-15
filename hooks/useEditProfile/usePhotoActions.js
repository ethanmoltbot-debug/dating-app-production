import { useCallback } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { isDecisionAllowed, moderatePhoto } from "@/utils/moderatePhoto";

export function usePhotoActions({ setPhotos, upload, userId }) {
  // Helper: support both manipulateAsync and manipulateImage
  const manipulate = useCallback(async (uri) => {
    const fn =
      typeof ImageManipulator.manipulateAsync === "function"
        ? ImageManipulator.manipulateAsync
        : ImageManipulator.manipulateImage;

    if (typeof fn !== "function") {
      throw new Error("Image tools not available");
    }

    // Resize a bit + force JPEG to avoid HEIC/unsupported formats.
    // IMPORTANT: do NOT request base64 here. Posting base64 JSON to /_create/api/upload
    // can exceed request limits and produce 400 "Invalid request".
    return await fn(uri, [{ resize: { width: 1440 } }], {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    });
  }, []);

  const addPhoto = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Photos", "Please allow photo access to add photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        return;
      }

      // Prefer: manipulate to a real JPEG file and upload as multipart (reactNativeAsset)
      // to avoid sending huge base64 payloads.
      let uploadedUrl = null;
      let lastError = null;

      try {
        const manipulated = await manipulate(asset.uri);

        const name = `photo-${Date.now()}.jpg`;
        const uriToUpload = manipulated?.uri || asset.uri;

        const { url, error: uploadErr } = await upload({
          reactNativeAsset: {
            uri: uriToUpload,
            name,
            mimeType: "image/jpeg",
            type: "image",
          },
        });

        if (uploadErr) {
          lastError = uploadErr;
        } else {
          uploadedUrl = url;
        }
      } catch (e) {
        console.error(e);
        lastError = e?.message || "Could not prepare image";
      }

      // Fallback: try uploading original (might work on Android)
      if (!uploadedUrl) {
        const name = `photo-${Date.now()}.jpg`;
        const { url, error: uploadErr } = await upload({
          reactNativeAsset: {
            uri: asset.uri,
            name,
            mimeType: asset.mimeType || "image/jpeg",
            type: "image",
          },
        });

        if (uploadErr) {
          const msg = uploadErr || lastError || "Upload failed";
          Alert.alert(
            "Upload failed",
            `${msg}\n\nTip: If your iPhone photo is HEIC, try changing iOS Camera Settings > Formats to "Most Compatible".`,
          );
          return;
        }

        uploadedUrl = url;
      }

      // Photo moderation (Google Vision SafeSearch)
      const mod = await moderatePhoto({
        userId,
        imageUrl: uploadedUrl,
        purpose: "profile_photo",
      });

      if (!mod?.ok) {
        Alert.alert(
          "Could not verify photo",
          mod?.error || "Please try a different photo.",
        );
        return;
      }

      if (
        !isDecisionAllowed(
          mod?.decision,
          mod?.moderationSkipped,
          "profile_photo",
        )
      ) {
        Alert.alert(
          "Photo not allowed",
          "That photo looks like it might be adult or unsafe content. Please choose another one.",
        );
        return;
      }

      setPhotos((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next.push(uploadedUrl);
        return next.slice(0, 6);
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Photos", "Could not add photo.");
    }
  }, [manipulate, upload, setPhotos, userId]);

  const removePhoto = useCallback(
    (idx) => {
      setPhotos((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next.splice(idx, 1);
        return next;
      });
    },
    [setPhotos],
  );

  const reorderPhotos = useCallback(
    (nextPhotos) => {
      setPhotos(() => {
        const arr = Array.isArray(nextPhotos) ? nextPhotos : [];
        // keep only strings, trim, and enforce max 6
        const cleaned = arr
          .filter((p) => typeof p === "string" && p.length > 0)
          .slice(0, 6);
        return cleaned;
      });
    },
    [setPhotos],
  );

  return {
    addPhoto,
    removePhoto,
    reorderPhotos,
  };
}
