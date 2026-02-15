import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckCircle2, Camera } from "lucide-react-native";

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

export default function ScreeningReviewing() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const nextPath = useMemo(() => {
    const next = params?.next;
    if (typeof next === "string" && next.startsWith("/")) {
      return next;
    }
    // Default back to the pre-quiz gate so users still see the intro screen.
    return "/screening/gate";
  }, [params?.next]);

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const accent = "#7C3AED";

  const [phase, setPhase] = useState("reviewing");
  const [hint, setHint] = useState("Reviewing your selfie…");

  const pollRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const completedRef = useRef(false);

  const checkAnim = useRef(new Animated.Value(0)).current;

  const MIN_REVIEW_MS = 1800; // keep the spinner up long enough to feel real
  const SUCCESS_STAY_MS = 2600; // success should not vanish too quickly

  const animateCheck = useCallback(() => {
    checkAnim.setValue(0);
    Animated.spring(checkAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [checkAnim]);

  const fetchProfile = useCallback(async () => {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) {
      router.replace("/auth/login");
      return { profile: null };
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.id) {
      router.replace("/auth/login");
      return { profile: null };
    }

    const resp = await fetch(`/api/profile/me?userId=${Number(parsed.id)}`);
    if (!resp.ok) {
      throw new Error(
        `When fetching /api/profile/me, the response was [${resp.status}] ${resp.statusText}`,
      );
    }

    const json = await resp.json();
    return { profile: json?.profile || null };
  }, [router]);

  const goToSuccess = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_REVIEW_MS - elapsed);

    await new Promise((r) => setTimeout(r, remaining));

    setPhase("success");
    setHint("Verified — you’re all set.");
    animateCheck();

    setTimeout(() => {
      router.replace(nextPath);
    }, SUCCESS_STAY_MS);
  }, [MIN_REVIEW_MS, SUCCESS_STAY_MS, animateCheck, nextPath, router]);

  const goToRejected = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_REVIEW_MS - elapsed);
    await new Promise((r) => setTimeout(r, remaining));

    setPhase("rejected");
    setHint(
      "We couldn’t verify this selfie. Please retake it (good lighting, face visible).",
    );
  }, [MIN_REVIEW_MS]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const { profile } = await fetchProfile();
        if (cancelled) return;

        const status = String(profile?.verification_status || "none");
        const isVerified = profile?.is_verified === true;

        if (isVerified) {
          goToSuccess();
          return;
        }

        if (status === "rejected") {
          goToRejected();
          return;
        }

        // Still pending/none
        setHint("Reviewing your selfie…");
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setPhase("error");
          setHint("Could not check verification status. Please try again.");
        }
      }
    };

    tick();

    pollRef.current = setInterval(() => {
      tick();
    }, 900);

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [fetchProfile, goToRejected, goToSuccess]);

  const checkScale = useMemo(() => {
    return checkAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    });
  }, [checkAnim]);

  const checkOpacity = useMemo(() => {
    return checkAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
  }, [checkAnim]);

  const showSpinner = phase === "reviewing";
  const showCheck = phase === "success";

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
            width: "100%",
            maxWidth: 420,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 24,
            paddingVertical: 26,
            paddingHorizontal: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            alignItems: "center",
          }}
        >
          {showSpinner ? (
            <ActivityIndicator color={accent} size="large" />
          ) : null}

          {showCheck ? (
            <Animated.View
              style={{
                opacity: checkOpacity,
                transform: [{ scale: checkScale }],
              }}
            >
              <CheckCircle2 size={62} color={accent} />
            </Animated.View>
          ) : null}

          <Text
            style={{
              marginTop: 16,
              fontSize: 20,
              fontWeight: "900",
              color: "#111",
              textAlign: "center",
            }}
          >
            {phase === "success" ? "Success" : "Reviewing"}
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              lineHeight: 20,
              fontWeight: "700",
            }}
          >
            {hint}
          </Text>

          {phase === "rejected" || phase === "error" ? (
            <View style={{ width: "100%", marginTop: 18 }}>
              <TouchableOpacity
                onPress={() => router.replace("/screening/gate")}
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
                  Retake selfie
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ paddingBottom: insets.bottom + 20 }} />
    </View>
  );
}
