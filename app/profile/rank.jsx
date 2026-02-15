import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Copy, ChevronLeft } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import useUpload from "@/utils/useUpload";
import ShareCardSheet from "@/components/ShareCardSheet";
// NOTE: keep import (might be useful later), but we no longer hard-require dataUrl conversion to open the share sheet.
import { prepareShareCardDataUrl } from "@/utils/shareCardImage";

const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

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

function normalizeAudienceGenderFromProfile(profile) {
  const g = String(profile?.gender || "")
    .toLowerCase()
    .trim();

  // IMPORTANT: check female/woman BEFORE male/man.
  // Otherwise "female" matches "male" (substring) and we misclassify women.
  if (g.includes("female") || g.includes("woman")) return "FEMALE";
  if (g.includes("male") || g.includes("man")) return "MALE";
  return "FEMALE";
}

function getMaterialLine(audienceGender) {
  if (audienceGender === "MALE") {
    return "You’re husband material.";
  }
  if (audienceGender === "FEMALE") {
    return "You’re Wifey material.";
  }
  return "You’re Wifey / husband material.";
}

export default function RankScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = "#7C3AED";

  // Prefer the proxy base URL on device (localhost base URLs won’t resolve on a real phone)
  const baseURL = useMemo(() => {
    const proxy = process.env.EXPO_PUBLIC_PROXY_BASE_URL || "";
    const direct = process.env.EXPO_PUBLIC_BASE_URL || "";

    if (Platform.OS !== "web") {
      return proxy || direct;
    }
    return direct || proxy;
  }, []);

  const toAbsoluteUrl = useCallback(
    (pathOrUrl) => {
      if (!pathOrUrl || typeof pathOrUrl !== "string") return null;
      if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return pathOrUrl;
      }
      if (!baseURL) return pathOrUrl;
      if (baseURL.endsWith("/") && pathOrUrl.startsWith("/")) {
        return `${baseURL.slice(0, -1)}${pathOrUrl}`;
      }
      if (!baseURL.endsWith("/") && !pathOrUrl.startsWith("/")) {
        return `${baseURL}/${pathOrUrl}`;
      }
      return `${baseURL}${pathOrUrl}`;
    },
    [baseURL],
  );

  const numberFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-US");
    } catch {
      return null;
    }
  }, []);

  const formatNumber = useCallback(
    (n) => {
      if (typeof n !== "number") {
        return "0";
      }
      if (numberFormatter) {
        return numberFormatter.format(n);
      }
      return String(n);
    },
    [numberFormatter],
  );

  const userQuery = useQuery({
    queryKey: ["me", "localUser"],
    queryFn: async () => {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  });

  const userId = userQuery.data?.id ? Number(userQuery.data.id) : null;

  const profileQuery = useQuery({
    queryKey: ["profile", "me", userId],
    enabled: Number.isFinite(userId),
    queryFn: async () => {
      const resp = await fetch(`/api/profile/me?userId=${userId}`);
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/profile/me, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      const json = await resp.json();
      return json?.profile || null;
    },
    staleTime: 60_000,
  });

  const [upload, { loading: uploadLoading }] = useUpload();
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const [localCard, setLocalCard] = useState({
    sourceUrl: null,
    dataUrl: null,
    loading: false,
  });

  const audienceGender = useMemo(() => {
    return normalizeAudienceGenderFromProfile(profileQuery.data);
  }, [profileQuery.data]);

  const materialLine = useMemo(() => {
    return getMaterialLine(audienceGender);
  }, [audienceGender]);

  const iconEmoji = useMemo(() => {
    return audienceGender === "MALE" ? "🤵" : "💍"; // women who pass: show ring (not bride)
  }, [audienceGender]);

  const rankQuery = useQuery({
    queryKey: ["quizRank", userId, audienceGender],
    enabled: Number.isFinite(userId),
    queryFn: async () => {
      const resp = await fetch(
        `/api/quiz/rank?userId=${userId}&gender=${audienceGender}`,
      );
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/quiz/rank, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      return resp.json();
    },
    staleTime: 30_000,
  });

  const isApproved = rankQuery.data?.isApproved === true;

  const shareCardQuery = useQuery({
    queryKey: ["quizShareCard", userId, audienceGender],
    enabled: Number.isFinite(userId) && isApproved,
    queryFn: async () => {
      const resp = await fetch(
        `/api/quiz/share-card?userId=${userId}&gender=${audienceGender}`,
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        const msg = body?.error || "Could not generate card";
        throw new Error(msg);
      }
      return resp.json();
    },
    staleTime: 30_000,
  });

  const rankRaw = rankQuery.data?.rank;
  const totalRaw = rankQuery.data?.totalCount;

  const rank =
    typeof rankRaw === "number" && Number.isFinite(rankRaw) ? rankRaw : null;
  const total =
    typeof totalRaw === "number" && Number.isFinite(totalRaw) ? totalRaw : null;

  const scoreLine =
    rank != null && total != null
      ? `${formatNumber(rank)} / ${formatNumber(total)}`
      : null;

  const imageUrl = shareCardQuery.data?.imageUrl || null;
  const downloadUrl = shareCardQuery.data?.downloadUrl || null;
  const shareText = shareCardQuery.data?.shareText || null;

  const downloadAbsUrl = useMemo(() => {
    return toAbsoluteUrl(downloadUrl);
  }, [downloadUrl, toAbsoluteUrl]);

  const getBestImageUrl = useCallback(() => {
    return uploadedImageUrl || imageUrl;
  }, [uploadedImageUrl, imageUrl]);

  const ensureUploaded = useCallback(async () => {
    const current = getBestImageUrl();
    if (uploadedImageUrl || !imageUrl) {
      return current;
    }

    const { url, error } = await upload({ url: imageUrl });
    if (error) {
      console.error(error);
      throw new Error(error);
    }
    if (url) {
      setUploadedImageUrl(url);
      return url;
    }

    throw new Error("Could not generate a shareable image.");
  }, [getBestImageUrl, uploadedImageUrl, imageUrl, upload]);

  const ensureShareableImageUrl = useCallback(async () => {
    // We MUST have a stable https URL for iOS/Share sheet.
    // Data URLs are unreliable in the Anything AI simulator host.
    try {
      const uploaded = await ensureUploaded();
      return uploaded || imageUrl || downloadAbsUrl || null;
    } catch (e) {
      console.error(e);
      return imageUrl || downloadAbsUrl || null;
    }
  }, [downloadAbsUrl, ensureUploaded, imageUrl]);

  // Keep the existing logic around localCard, but treat it as a best-effort enhancement.
  // If it fails, we still open the share sheet with the remote image URL.
  const ensureLocalCardUri = useCallback(async () => {
    const stableRemoteUrl = await ensureShareableImageUrl();
    if (!stableRemoteUrl) return null;

    if (localCard?.dataUrl && localCard?.sourceUrl === stableRemoteUrl) {
      return localCard.dataUrl;
    }

    try {
      setLocalCard({
        sourceUrl: stableRemoteUrl,
        dataUrl: null,
        loading: true,
      });

      const { dataUrl } = await prepareShareCardDataUrl(stableRemoteUrl);

      setLocalCard({ sourceUrl: stableRemoteUrl, dataUrl, loading: false });
      return dataUrl;
    } catch (e) {
      console.error(e);
      setLocalCard({
        sourceUrl: stableRemoteUrl,
        dataUrl: null,
        loading: false,
      });
      return null;
    }
  }, [ensureShareableImageUrl, localCard]);

  const handleCopyCardLink = useCallback(async () => {
    const bestUrl = getBestImageUrl();
    if (!bestUrl) {
      Alert.alert("Copy", "Your card is still generating.");
      return;
    }
    try {
      await Clipboard.setStringAsync(bestUrl);
      Alert.alert("Copied", "Image link copied.");
    } catch (e) {
      console.error(e);
      Alert.alert("Copy", "Could not copy.");
    }
  }, [getBestImageUrl]);

  const handleOpenCard = useCallback(async () => {
    const bestUrl = getBestImageUrl();
    if (!bestUrl) {
      Alert.alert("Open", "Your card is still generating.");
      return;
    }
    try {
      await Linking.openURL(bestUrl);
    } catch (e) {
      console.error(e);
      Alert.alert("Open", "Could not open link.");
    }
  }, [getBestImageUrl]);

  const handleSaveImage = useCallback(async () => {
    // IMPORTANT: In the Anything AI iOS simulator host, Share.share() often rejects data URLs.
    // So we (1) try dataUrl (best case), then (2) fall back to the stable https URL.

    // Small delay lets our modal close cleanly before iOS share sheet opens.
    await new Promise((r) => setTimeout(r, 250));

    const stableUrl = await ensureShareableImageUrl();
    const dataUrl = await ensureLocalCardUri();

    // iOS share sheet is happiest with a real https (or file://) URL.
    // Data URLs often fail in the Anything AI simulator host.
    const shareUrl = Platform.OS === "ios" ? stableUrl : dataUrl || stableUrl;

    if (!shareUrl) {
      Alert.alert(
        "Save",
        "Your card is still generating. Please try again in a moment.",
      );
      return;
    }

    try {
      if (Platform.OS === "ios") {
        await Share.share({ url: shareUrl });
      } else {
        await Share.share({ message: shareUrl });
      }
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Save",
        "Could not open the share sheet right now. Please try again.",
      );
    }
  }, [ensureLocalCardUri, ensureShareableImageUrl]);

  const handleShareInstagramStory = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 250));

    const stableUrl = await ensureShareableImageUrl();
    const dataUrl = await ensureLocalCardUri();

    const shareUrl = Platform.OS === "ios" ? stableUrl : dataUrl || stableUrl;

    if (!shareUrl) {
      Alert.alert(
        "Share",
        "Your card is still generating. Try again in a moment.",
      );
      return;
    }

    try {
      const message = shareText || "";
      if (Platform.OS === "ios") {
        await Share.share({ url: shareUrl, message });
      } else {
        await Share.share({
          message: message ? `${message}\n\n${shareUrl}` : shareUrl,
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Share", "Could not open sharing. Please try again.");
    }
  }, [ensureLocalCardUri, ensureShareableImageUrl, shareText]);

  const handleShareCard = useCallback(async () => {
    if (!imageUrl) {
      Alert.alert(
        "Share",
        "Your share card is still generating. Please try again in a moment.",
      );
      return;
    }

    try {
      const bestUrl = await ensureUploaded();
      const message = shareText ? `${shareText}\n\n${bestUrl}` : bestUrl;
      await Share.share({ message, url: bestUrl });
    } catch (e) {
      console.error(e);
      Alert.alert("Share", "Could not open sharing. Please try again.");
    }
  }, [ensureUploaded, imageUrl, shareText]);

  const handleShareMore = useCallback(async () => {
    await handleShareCard();
  }, [handleShareCard]);

  const openShareSheet = useCallback(() => {
    if (!isApproved) {
      Alert.alert("Share", "Take the screening to unlock sharing.");
      return;
    }
    setShareSheetOpen(true);
  }, [isApproved]);

  const closeShareSheet = useCallback(() => {
    setShareSheetOpen(false);
  }, []);

  const loading =
    userQuery.isLoading || profileQuery.isLoading || rankQuery.isLoading;

  const shareDisabled = !isApproved || uploadLoading || localCard.loading;

  const titleLine = useMemo(() => {
    return isApproved ? "You passed." : "Standard Rank.";
  }, [isApproved]);

  return (
    <View
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      {/* Back button (keep subtle, like the rest of the app) */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 16,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.78)",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.08)",
          }}
        >
          <ChevronLeft size={22} color="#111" />
        </TouchableOpacity>
      </View>

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
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
          }}
        >
          <Text style={{ fontSize: 62, lineHeight: 70 }}>{iconEmoji}</Text>
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
          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: "#111",
              marginBottom: 10,
              letterSpacing: 0.5,
              textAlign: "center",
            }}
          >
            {titleLine}
          </Text>

          <Text
            style={{
              fontSize: 18,
              color: "#111",
              textAlign: "center",
              lineHeight: 26,
              paddingHorizontal: 8,
              marginBottom: 18,
              fontWeight: "900",
            }}
          >
            {isApproved ? materialLine : "Take the screening to unlock this."}
          </Text>

          <View style={{ alignItems: "center", marginBottom: 18 }}>
            {loading ? (
              <ActivityIndicator color={accent} />
            ) : isApproved ? (
              <>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "900",
                    color: "#111",
                    letterSpacing: 0.6,
                  }}
                >
                  {scoreLine || "—"}
                </Text>

                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "#6B7280",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  and growing.
                </Text>
              </>
            ) : (
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "900",
                  color: "#111",
                  letterSpacing: 0.6,
                }}
              >
                —
              </Text>
            )}
          </View>

          <View style={{ gap: 10 }}>
            {/* Primary CTA: Share (opens our share sheet like the screenshot) */}
            <TouchableOpacity
              onPress={openShareSheet}
              activeOpacity={0.9}
              style={{ borderRadius: 16, overflow: "hidden" }}
              disabled={shareDisabled}
            >
              <LinearGradient
                colors={CTA_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: shareDisabled ? 0.75 : 1,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}
                >
                  {uploadLoading ? "Preparing..." : "Share"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={{
                marginTop: 2,
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={handleCopyCardLink}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  opacity: isApproved ? 1 : 0.5,
                }}
                disabled={!isApproved}
              >
                <Copy size={16} color="#6B7280" />
                <Text style={{ color: "#6B7280", fontWeight: "800" }}>
                  Copy link
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenCard}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  opacity: isApproved ? 1 : 0.5,
                }}
                disabled={!isApproved}
              >
                <ExternalLink size={16} color="#6B7280" />
                <Text style={{ color: "#6B7280", fontWeight: "800" }}>
                  Open
                </Text>
              </TouchableOpacity>
            </View>

            {isApproved ? (
              <Text
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: 16,
                }}
              >
                Tip: Share → Save image.
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ShareCardSheet
        visible={shareSheetOpen}
        onClose={closeShareSheet}
        disabled={shareDisabled}
        onSaveImage={async () => {
          closeShareSheet();
          await handleSaveImage();
        }}
        onShareInstagramStory={async () => {
          closeShareSheet();
          await handleShareInstagramStory();
        }}
        onShareMore={async () => {
          closeShareSheet();
          await handleShareMore();
        }}
        onCopyLink={async () => {
          closeShareSheet();
          await handleCopyCardLink();
        }}
      />
    </View>
  );
}
