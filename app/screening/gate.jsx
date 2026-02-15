import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Heart, Camera } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as RNImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import useUpload from "@/utils/useUpload";
import { isDecisionAllowed, moderatePhoto } from "@/utils/moderatePhoto";

function SoftBlobsBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -80,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: "rgba(255, 79, 216, 0.16)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 120,
          right: -110,
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: "rgba(124, 58, 237, 0.14)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -120,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: "rgba(99, 179, 237, 0.16)",
        }}
      />
    </View>
  );
}

export default function ScreeningGate() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];
  const accent = "#7C3AED";

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const busy = submitting || uploadLoading;

  const [autoReviewing, setAutoReviewing] = useState(false);
  const pollRef = useRef(null);

  const verificationStatus = useMemo(() => {
    return String(profile?.verification_status || "none");
  }, [profile?.verification_status]);

  const isVerified = profile?.is_verified === true;

  const verificationHint = useMemo(() => {
    if (verificationStatus === "pending") {
      if (autoReviewing) {
        return "Reviewing your selfie…";
      }
      return "We’re reviewing your photo now. This usually only takes a few seconds.";
    }
    if (verificationStatus === "rejected") {
      return "Your selfie was denied. Please re-upload a clearer selfie (good lighting, face visible).";
    }
    return null;
  }, [autoReviewing, verificationStatus]);

  const loadUserAndProfile = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem("user");
      if (!raw) {
        setUser(null);
        setProfile(null);
        return;
      }

      const parsed = JSON.parse(raw);
      setUser(parsed);

      if (!parsed?.id) {
        setProfile(null);
        return;
      }

      const resp = await fetch(`/api/profile/me?userId=${Number(parsed.id)}`);
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/profile/me, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      const json = await resp.json();
      setProfile(json?.profile || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserAndProfile();
  }, [loadUserAndProfile]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (loading) {
      setAutoReviewing(false);
      return;
    }

    const shouldPoll = !isVerified && verificationStatus === "pending";
    if (!shouldPoll) {
      setAutoReviewing(false);
      return;
    }

    setAutoReviewing(true);
    pollRef.current = setInterval(() => {
      loadUserAndProfile();
    }, 1200);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isVerified, loading, loadUserAndProfile, verificationStatus]);

  const ensureJpegAsset = useCallback(async (asset) => {
    if (!asset?.uri) return asset;

    const uriLower = String(asset.uri).toLowerCase();
    const mimeLower = String(asset.mimeType || "").toLowerCase();

    const isHeic =
      uriLower.endsWith(".heic") ||
      mimeLower.includes("heic") ||
      mimeLower.includes("heif");

    // Even when not HEIC, normalizing to jpeg has proven more reliable for uploads + Vision.
    const shouldNormalize = true;

    if (!shouldNormalize && !isHeic) {
      return asset;
    }

    try {
      const manipulated = await ImageManipulator.manipulateImage(
        asset.uri,
        [],
        {
          compress: 0.92,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      if (!manipulated?.uri) {
        return asset;
      }

      return {
        ...asset,
        uri: manipulated.uri,
        mimeType: "image/jpeg",
        type: "image",
        fileName: "verification.jpg",
        name: "verification.jpg",
      };
    } catch (e) {
      console.error("Could not normalize image to JPEG", e);
      return asset;
    }
  }, []);

  const pickSelfie = useCallback(async () => {
    try {
      const perm = await RNImagePicker.requestCameraPermissionsAsync();
      const granted = perm?.status === "granted";

      if (granted) {
        const result = await RNImagePicker.launchCameraAsync({
          mediaTypes: RNImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.9,
        });
        if (!result.canceled) {
          setSelectedImage(result.assets[0]);
        }
        return;
      }

      const libPerm = await RNImagePicker.requestMediaLibraryPermissionsAsync();
      if (libPerm?.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow camera or photo library access to upload a verification photo.",
        );
        return;
      }

      const result = await RNImagePicker.launchImageLibraryAsync({
        mediaTypes: RNImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not open camera/photos.");
    }
  }, []);

  const submitVerification = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Sign in", "Please sign in first.");
      router.replace("/auth/login");
      return;
    }

    if (!selectedImage) {
      Alert.alert("Missing photo", "Please take a selfie to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const jpegAsset = await ensureJpegAsset(selectedImage);

      const uploaded = await upload({ reactNativeAsset: jpegAsset });
      if (uploaded?.error) {
        throw new Error(uploaded.error);
      }

      const verificationPhotoUrl = uploaded?.url;
      if (!verificationPhotoUrl) {
        throw new Error("Upload failed");
      }

      // Moderate before submitting (the server also enforces this).
      const mod = await moderatePhoto({
        userId: Number(user.id),
        imageUrl: verificationPhotoUrl,
        purpose: "verification_photo",
      });

      if (!mod?.ok) {
        throw new Error(mod?.error || "Could not verify photo");
      }

      if (
        !isDecisionAllowed(
          mod?.decision,
          mod?.moderationSkipped,
          "verification_photo",
        )
      ) {
        throw new Error(
          "That photo looks like it might be adult or unsafe content. Please take a different selfie.",
        );
      }

      const resp = await fetch("/api/profile/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(user.id),
          verificationPhotoUrl,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `When POSTing /api/profile/verification, the response was [${resp.status}] ${resp.statusText} ${text}`,
        );
      }

      const json = await resp.json();
      setProfile(json?.profile || profile);
      setSelectedImage(null);

      // Immediately move to a dedicated reviewing screen (spinner), then it auto-advances.
      // After success, send them back to this pre-quiz gate so they still see the intro screen.
      router.replace("/screening/reviewing?next=/screening/gate");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e?.message || "Could not submit verification.");
    } finally {
      setSubmitting(false);
    }
  }, [ensureJpegAsset, profile, router, selectedImage, upload, user?.id]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      <View
        style={{
          flex: 1,
          padding: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
          }}
        >
          <Heart size={56} color={accent} />
        </View>

        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 24,
            paddingVertical: 22,
            paddingHorizontal: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
          }}
        >
          {loading ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <ActivityIndicator color={accent} />
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "#6B7280",
                  fontWeight: "700",
                }}
              >
                Loading…
              </Text>
            </View>
          ) : isVerified ? (
            <>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "900",
                  color: "#111",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Welcome
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "#374151",
                  textAlign: "center",
                  lineHeight: 24,
                  marginBottom: 8,
                  fontWeight: "700",
                }}
              >
                Before we begin, we’d like to get to know you better.
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  color: "#4B5563",
                  textAlign: "center",
                  lineHeight: 22,
                  paddingHorizontal: 6,
                }}
              >
                This brief screening helps us create a wonderful experience
                tailored just for you.
              </Text>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: "#111",
                  letterSpacing: 0.2,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                Verify your photo
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: "#4B5563",
                  textAlign: "center",
                  lineHeight: 20,
                  marginBottom: 14,
                  fontWeight: "700",
                }}
              >
                To make sure you see the correct screening (and to keep the
                community safe), we require photo verification.
              </Text>

              <View
                style={{
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.08)",
                  backgroundColor: "rgba(17,17,17,0.02)",
                }}
              >
                <Text
                  style={{ fontSize: 13, color: "#6B7280", fontWeight: "800" }}
                >
                  Status: {verificationStatus}
                </Text>

                {verificationHint ? (
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#6B7280",
                      textAlign: "center",
                      lineHeight: 16,
                    }}
                  >
                    {verificationHint}
                  </Text>
                ) : null}

                {profile?.verification_photo_url ? (
                  <View style={{ marginTop: 10, alignItems: "center" }}>
                    <Image
                      source={{ uri: profile.verification_photo_url }}
                      style={{ width: 120, height: 120, borderRadius: 18 }}
                      contentFit="cover"
                      transition={150}
                    />
                    <Text
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "#6B7280",
                        textAlign: "center",
                      }}
                    >
                      You can re-upload a new photo anytime.
                    </Text>
                  </View>
                ) : null}

                {selectedImage?.uri ? (
                  <View style={{ marginTop: 10, alignItems: "center" }}>
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={{ width: 120, height: 120, borderRadius: 18 }}
                      contentFit="cover"
                      transition={150}
                    />
                  </View>
                ) : null}
              </View>

              <View style={{ height: 14 }} />

              <TouchableOpacity
                onPress={pickSelfie}
                disabled={busy || autoReviewing}
                activeOpacity={0.9}
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.10)",
                  backgroundColor: "rgba(17,17,17,0.03)",
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <Camera size={18} color="#111" />
                <Text style={{ color: "#111", fontWeight: "900" }}>
                  {autoReviewing
                    ? "Reviewing…"
                    : profile?.verification_photo_url
                      ? "Retake selfie"
                      : "Take selfie"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={{ padding: 24, paddingBottom: insets.bottom + 24 }}>
        {loading ? null : isVerified ? (
          <TouchableOpacity
            onPress={() => router.push("/screening/quiz")}
            activeOpacity={0.9}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.14,
              shadowRadius: 16,
            }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>
                Begin
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={submitVerification}
            disabled={busy || !selectedImage}
            activeOpacity={0.9}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              opacity: busy || !selectedImage ? 0.6 : 1,
            }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18, alignItems: "center" }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}
                >
                  Submit verification
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
