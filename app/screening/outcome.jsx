import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  CheckCircle,
  XCircle,
  Clock,
  Share2,
  ExternalLink,
  Copy,
} from "lucide-react-native";
import { useMemo, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import useUpload from "@/utils/useUpload";
import ShareCardSheet from "@/components/ShareCardSheet";
import { prepareShareCardDataUrl } from "@/utils/shareCardImage";

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

function getMaterialLine(audienceGender) {
  if (audienceGender === "MALE") {
    return "You’re husband material.";
  }
  if (audienceGender === "FEMALE") {
    // Match the tone requested for the pass screen.
    return "You’re wifey material.";
  }
  return "You’re wifey / husband material.";
}

function getOutcomeEmoji(audienceGender) {
  if (audienceGender === "MALE") return "🤵";
  // Requested: bride emoji for women
  return "👰";
}

function safeJsonObject(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore
  }
  return {};
}

export default function OutcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { result } = useLocalSearchParams();

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];
  const accent = "#7C3AED";

  // Prefer proxy base URL on device so image downloads don’t point at localhost
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

  const isApproved = result === "APPROVED";

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
      // Fallback (should rarely happen)
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
    const g = String(profileQuery.data?.gender || "")
      .toLowerCase()
      .trim();

    // IMPORTANT: check female/woman BEFORE male/man.
    // Otherwise "female" matches "male" (substring) and we misclassify women.
    if (g.includes("female") || g.includes("woman")) return "FEMALE";
    if (g.includes("male") || g.includes("man")) return "MALE";
    return "FEMALE";
  }, [profileQuery.data?.gender]);

  const outcomeEmoji = useMemo(() => {
    return getOutcomeEmoji(audienceGender);
  }, [audienceGender]);

  const materialLine = useMemo(() => {
    return getMaterialLine(audienceGender);
  }, [audienceGender]);

  const { data: rankData, isLoading: rankLoading } = useQuery({
    queryKey: ["quizRank", isApproved ? userId : "skip", audienceGender],
    enabled: isApproved && Number.isFinite(userId),
    queryFn: async () => {
      const response = await fetch(
        `/api/quiz/rank?userId=${userId}&gender=${audienceGender}`,
      );
      if (!response.ok) {
        throw new Error(
          `When fetching /api/quiz/rank, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    staleTime: 60_000,
  });

  const { data: shareCardData } = useQuery({
    queryKey: ["quizShareCard", isApproved ? userId : "skip", audienceGender],
    enabled: isApproved && Number.isFinite(userId),
    queryFn: async () => {
      const response = await fetch(
        `/api/quiz/share-card?userId=${userId}&gender=${audienceGender}`,
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Could not generate share card");
      }
      return response.json();
    },
    staleTime: 60_000,
  });

  const rankRaw = rankData?.rank;
  const totalRaw = rankData?.totalCount;

  const rank =
    typeof rankRaw === "number" && Number.isFinite(rankRaw) ? rankRaw : null;
  const total =
    typeof totalRaw === "number" && Number.isFinite(totalRaw) ? totalRaw : null;

  const scoreLine =
    rank != null && total != null
      ? `${formatNumber(rank)} / ${formatNumber(total)}`
      : null;

  const imageUrl = shareCardData?.imageUrl || null;
  const downloadUrl = shareCardData?.downloadUrl || null;
  const shareText = shareCardData?.shareText || null;

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
    try {
      const uploaded = await ensureUploaded();
      return uploaded || imageUrl || downloadAbsUrl || null;
    } catch (e) {
      console.error(e);
      return imageUrl || downloadAbsUrl || null;
    }
  }, [downloadAbsUrl, ensureUploaded, imageUrl]);

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
    } catch (error) {
      console.error(error);
      Alert.alert("Share", "Could not open sharing. Please try again.");
    }
  }, [ensureUploaded, imageUrl, shareText]);

  const handleCopyCardLink = useCallback(async () => {
    const bestUrl = getBestImageUrl();
    if (!bestUrl) {
      Alert.alert("Copy", "Share card is still generating.");
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
      Alert.alert("Open", "Share card is still generating.");
      return;
    }
    try {
      await Linking.openURL(bestUrl);
    } catch (e) {
      console.error(e);
      Alert.alert("Open", "Could not open link.");
    }
  }, [getBestImageUrl]);

  const ensureLocalCardUri = useCallback(async () => {
    const stableRemoteUrl = await ensureShareableImageUrl();

    if (!stableRemoteUrl) {
      return null;
    }

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

      setLocalCard({
        sourceUrl: stableRemoteUrl,
        dataUrl,
        loading: false,
      });
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

  const handleSaveImage = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 250));

    const stableUrl = await ensureShareableImageUrl();
    const dataUrl = await ensureLocalCardUri();

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

  const handleShareMore = useCallback(async () => {
    await handleShareCard();
  }, [handleShareCard]);

  const openShareSheet = useCallback(() => {
    setShareSheetOpen(true);
  }, []);

  const closeShareSheet = useCallback(() => {
    setShareSheetOpen(false);
  }, []);

  const onboardingComplete = useMemo(() => {
    const prefs = safeJsonObject(profileQuery.data?.preferences);
    return prefs?.onboarding?.postQuizComplete === true;
  }, [profileQuery.data?.preferences]);

  const handleContinue = useCallback(async () => {
    // After passing the quiz, users must finish profile onboarding before entering the app.
    if (!onboardingComplete) {
      router.replace("/onboarding/profile");
      return;
    }

    // If they haven't seen the permissions screens yet on this device, show them.
    try {
      // v2 keys so we can re-run this flow even if an older combined screen was previously marked done.
      const doneV2 = await AsyncStorage.getItem(
        "wifey:onboarding_permissions:v2:done",
      );
      const shouldShow = !doneV2;

      if (shouldShow) {
        router.replace("/onboarding/notifications");
        return;
      }
    } catch (e) {
      console.error(e);
      // If storage fails, just fall through.
    }

    // IMPORTANT: route groups like (tabs) are not part of the URL
    router.replace("/home");
  }, [onboardingComplete, router]);

  const getOutcomeConfig = () => {
    switch (result) {
      case "APPROVED":
        return {
          icon: CheckCircle,
          title: "You passed.",
          message: null,
          buttonText: "Continue",
          onPress: handleContinue,
          kind: "APPROVED",
        };
      case "COOLDOWN":
        return {
          icon: Clock,
          title: "Please wait",
          message:
            "You can try again later. Take some time and come back soon.",
          buttonText: "View countdown",
          onPress: () => router.replace("/screening/cooldown"),
        };
      case "LIFETIME_INELIGIBLE": {
        return {
          icon: XCircle,
          title: "Decision made",
          message: null,
          buttonText: "Okay",
          onPress: () => router.replace("/auth/login"),
          kind: "LIFETIME_INELIGIBLE",
        };
      }
      case "FAILED":
      default:
        return {
          icon: XCircle,
          title: "Not quite right",
          message: "Unfortunately, we can't move forward at this time.",
          buttonText: "Okay",
          onPress: () => router.replace("/auth/login"),
          kind: "FAILED",
        };
    }
  };

  const config = getOutcomeConfig();
  const Icon = config.icon;
  const isLifetime = config.kind === "LIFETIME_INELIGIBLE";

  const shouldShowApprovedCard = config.kind === "APPROVED";

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
          {shouldShowApprovedCard ? (
            <Text style={{ fontSize: 62, lineHeight: 70 }}>{outcomeEmoji}</Text>
          ) : (
            <Icon size={64} color={accent} />
          )}
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
              marginBottom: shouldShowApprovedCard ? 10 : 14,
              letterSpacing: 0.5,
              textAlign: "center",
            }}
          >
            {config.title}
          </Text>

          {shouldShowApprovedCard ? (
            <>
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
                {materialLine}
              </Text>

              <View style={{ alignItems: "center", marginBottom: 18 }}>
                {rankLoading ||
                userQuery.isLoading ||
                profileQuery.isLoading ? (
                  <ActivityIndicator color={accent} />
                ) : scoreLine ? (
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: "900",
                      color: "#111",
                      letterSpacing: 0.6,
                    }}
                  >
                    {scoreLine}
                  </Text>
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
              </View>

              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.9}
                  style={{ borderRadius: 16, overflow: "hidden" }}
                >
                  <LinearGradient
                    colors={CTA_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 16, alignItems: "center" }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}
                    >
                      Continue
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={openShareSheet}
                  activeOpacity={0.9}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(17,17,17,0.10)",
                    backgroundColor: "rgba(255,255,255,0.72)",
                    paddingVertical: 14,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                    opacity: uploadLoading ? 0.7 : 1,
                  }}
                  disabled={uploadLoading}
                >
                  <Share2 size={18} color="#111" />
                  <Text
                    style={{ color: "#111", fontSize: 16, fontWeight: "900" }}
                  >
                    {uploadLoading ? "Preparing..." : "Share"}
                  </Text>
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
                    }}
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
                    }}
                  >
                    <ExternalLink size={16} color="#6B7280" />
                    <Text style={{ color: "#6B7280", fontWeight: "800" }}>
                      Open
                    </Text>
                  </TouchableOpacity>
                </View>

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
              </View>
            </>
          ) : isLifetime ? (
            <View style={{ marginBottom: 18, paddingHorizontal: 6 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: "#111",
                  textAlign: "center",
                  lineHeight: 24,
                  marginBottom: 12,
                  paddingHorizontal: 10,
                  fontWeight: "900",
                }}
              >
                Wifey is built for people whose actions reduce doubt, not create
                it.
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "#374151",
                  textAlign: "center",
                  lineHeight: 24,
                  marginBottom: 12,
                  paddingHorizontal: 10,
                }}
              >
                Your answers show a fundamental misalignment with how we define
                commitment.
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "#111",
                  textAlign: "center",
                  lineHeight: 24,
                  marginBottom: 12,
                  paddingHorizontal: 10,
                  fontWeight: "900",
                }}
              >
                This decision is permanent
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: 18,
                  paddingHorizontal: 10,
                }}
              >
                This decision is based solely on quiz responses and applies
                equally to all users.
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 16,
                color: "#374151",
                textAlign: "center",
                lineHeight: 24,
                marginBottom: 18,
                paddingHorizontal: 12,
                fontWeight: "700",
              }}
            >
              {config.message}
            </Text>
          )}

          {!shouldShowApprovedCard ? (
            <TouchableOpacity
              onPress={config.onPress}
              activeOpacity={0.9}
              style={{ borderRadius: 16, overflow: "hidden", marginTop: 8 }}
            >
              <LinearGradient
                colors={CTA_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 16, alignItems: "center" }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}
                >
                  {config.buttonText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {shouldShowApprovedCard ? (
        <ShareCardSheet
          visible={shareSheetOpen}
          onClose={closeShareSheet}
          disabled={uploadLoading || localCard.loading}
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
      ) : null}
    </View>
  );
}
