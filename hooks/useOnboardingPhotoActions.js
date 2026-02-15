import { useCallback } from "react";
import { Alert } from "react-native";
import * as RNImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import useUpload from "@/utils/useUpload";
import { isDecisionAllowed, moderatePhoto } from "@/utils/moderatePhoto";

export function useOnboardingPhotoActions({
  setPrimaryPhotoUrl,
  setExtraPhotoUrls,
  userId,
}) {
  const [upload, { loading: uploadLoading }] = useUpload();

  const pickSinglePhoto = useCallback(async () => {
    const libPerm = await RNImagePicker.requestMediaLibraryPermissionsAsync();
    if (libPerm?.status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to add pictures.",
      );
      return null;
    }

    const result = await RNImagePicker.launchImageLibraryAsync({
      mediaTypes: RNImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (result.canceled) return null;
    return result.assets?.[0] || null;
  }, []);

  const safeErrorMessage = useCallback((err) => {
    if (!err) return "Upload failed";
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message || "Upload failed";
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }, []);

  const prepareJpegAsset = useCallback(async (asset) => {
    if (!asset?.uri) return asset;

    // Force JPEG to avoid HEIC edge cases in iOS/TestFlight.
    const fn =
      typeof ImageManipulator.manipulateAsync === "function"
        ? ImageManipulator.manipulateAsync
        : ImageManipulator.manipulateImage;

    if (typeof fn !== "function") {
      return asset;
    }

    const manipulated = await fn(asset.uri, [{ resize: { width: 1440 } }], {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const name = `profile-photo-${Date.now()}.jpg`;

    return {
      uri: manipulated?.uri || asset.uri,
      name,
      mimeType: "image/jpeg",
      type: "image",
    };
  }, []);

  const formatModerationHint = useCallback((mod) => {
    const decision = mod?.decision ? String(mod.decision) : "unknown";
    const adult = mod?.safeSearch?.adult ? String(mod.safeSearch.adult) : "?";
    const racy = mod?.safeSearch?.racy ? String(mod.safeSearch.racy) : "?";
    const violence = mod?.safeSearch?.violence
      ? String(mod.safeSearch.violence)
      : "?";

    // Keep short; this is mainly for TestFlight debugging.
    return `(scan: ${decision}; adult ${adult}; racy ${racy}; violence ${violence})`;
  }, []);

  const handlePickPrimaryPhoto = useCallback(async () => {
    try {
      const asset = await pickSinglePhoto();
      if (!asset) return;

      const prepared = await prepareJpegAsset(asset);

      const uploaded = await upload({ reactNativeAsset: prepared });
      if (uploaded?.error) {
        throw new Error(safeErrorMessage(uploaded.error));
      }
      if (!uploaded?.url) {
        throw new Error("Upload failed");
      }

      const mod = await moderatePhoto({
        userId,
        imageUrl: uploaded.url,
        purpose: "profile_photo",
      });

      if (!mod?.ok) {
        throw new Error(mod?.error || "Could not verify photo");
      }

      if (
        !isDecisionAllowed(
          mod?.decision,
          mod?.moderationSkipped,
          "profile_photo",
        )
      ) {
        const hint = formatModerationHint(mod);
        throw new Error(
          `That photo looks like it might be adult or unsafe content. Please choose another one. ${hint}`,
        );
      }

      setPrimaryPhotoUrl(uploaded.url);
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Photo",
        e?.message ||
          "Could not add photo. If it’s an iPhone HEIC, try Settings > Camera > Formats > Most Compatible.",
      );
    }
  }, [
    pickSinglePhoto,
    prepareJpegAsset,
    safeErrorMessage,
    upload,
    setPrimaryPhotoUrl,
    userId,
    formatModerationHint,
  ]);

  const handleAddExtraPhoto = useCallback(async () => {
    try {
      const asset = await pickSinglePhoto();
      if (!asset) return;

      const prepared = await prepareJpegAsset(asset);

      const uploaded = await upload({ reactNativeAsset: prepared });
      if (uploaded?.error) {
        throw new Error(safeErrorMessage(uploaded.error));
      }
      if (!uploaded?.url) {
        throw new Error("Upload failed");
      }

      const mod = await moderatePhoto({
        userId,
        imageUrl: uploaded.url,
        purpose: "profile_photo",
      });

      if (!mod?.ok) {
        throw new Error(mod?.error || "Could not verify photo");
      }

      if (
        !isDecisionAllowed(
          mod?.decision,
          mod?.moderationSkipped,
          "profile_photo",
        )
      ) {
        const hint = formatModerationHint(mod);
        throw new Error(
          `That photo looks like it might be adult or unsafe content. Please choose another one. ${hint}`,
        );
      }

      setExtraPhotoUrls((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const next = [...safePrev, uploaded.url];
        return Array.from(new Set(next)).slice(0, 5);
      });
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Photo",
        e?.message ||
          "Could not add photo. If it’s an iPhone HEIC, try Settings > Camera > Formats > Most Compatible.",
      );
    }
  }, [
    pickSinglePhoto,
    prepareJpegAsset,
    safeErrorMessage,
    upload,
    setExtraPhotoUrls,
    userId,
    formatModerationHint,
  ]);

  const removeExtraPhoto = useCallback(
    (url) => {
      setExtraPhotoUrls((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.filter((x) => x !== url);
      });
    },
    [setExtraPhotoUrls],
  );

  return {
    uploadLoading,
    handlePickPrimaryPhoto,
    handleAddExtraPhoto,
    removeExtraPhoto,
  };
}
