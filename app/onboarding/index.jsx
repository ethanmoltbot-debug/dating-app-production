import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

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

export default function OnboardingWelcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const userRaw = await AsyncStorage.getItem("user");
        if (!cancelled) {
          setHasUser(!!userRaw);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setHasUser(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const markSeenAndContinue = useCallback(async () => {
    try {
      await AsyncStorage.setItem("onboarding_seen", "true");
    } catch (e) {
      console.error(e);
      // If this fails, we still allow the user to continue.
    }

    // "Get Started" lands on the phone OTP sign-in screen.
    // If this device is already signed in, go straight to the app.
    if (hasUser) {
      router.replace("/home");
      return;
    }

    router.replace("/auth/login");
  }, [hasUser, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

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

      {/* Top brand */}
      <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
        <Text
          style={{
            fontSize: 44,
            fontWeight: "900",
            color: "#111",
            letterSpacing: 2,
            textAlign: "center",
          }}
        >
          Wifey
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
          Dating with intention
        </Text>
      </View>

      {/* Main copy in a soft card */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 24,
            paddingVertical: 22,
            paddingHorizontal: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#111",
              lineHeight: 28,
              textAlign: "center",
              marginBottom: 12,
              paddingHorizontal: 8,
            }}
          >
            Wifey is built for people dating with intention.
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: "#374151",
              lineHeight: 24,
              textAlign: "center",
              marginBottom: 10,
              fontWeight: "700",
              paddingHorizontal: 8,
            }}
          >
            We prioritize loyalty, transparency, and protecting a committed
            relationship.
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: "#4B5563",
              lineHeight: 24,
              textAlign: "center",
              paddingHorizontal: 8,
            }}
          >
            This isn’t a swipe-for-validation app.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ padding: 24, paddingBottom: insets.bottom + 24 }}>
        <TouchableOpacity
          onPress={markSeenAndContinue}
          activeOpacity={0.9}
          style={{
            width: "100%",
            maxWidth: 340,
            alignSelf: "center",
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.16,
            shadowRadius: 16,
          }}
        >
          <LinearGradient
            colors={CTA_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 18, alignItems: "center" }}
          >
            <Text style={{ fontSize: 17, fontWeight: "900", color: "#fff" }}>
              Get Started
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
