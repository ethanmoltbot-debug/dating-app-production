import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

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

function Card({ children }) {
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 420,
        alignSelf: "center",
        backgroundColor: "rgba(255,255,255,0.86)",
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
      }}
    >
      {children}
    </View>
  );
}

function StatusPill({ label, kind }) {
  const bg =
    kind === "granted"
      ? "rgba(16,185,129,0.14)"
      : kind === "denied"
        ? "rgba(239,68,68,0.12)"
        : "rgba(17,17,17,0.06)";

  const color =
    kind === "granted" ? "#047857" : kind === "denied" ? "#B91C1C" : "#6B7280";

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "900", color }}>{label}</Text>
    </View>
  );
}

const DONE_KEY = "wifey:onboarding_permissions:v2:done";

export default function OnboardingLocation() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const BG_GRADIENT = useMemo(() => ["#F7EEFF", "#F2F7FF", "#FFF1F7"], []);
  const CTA_GRADIENT = useMemo(() => ["#FF4FD8", "#7C3AED"], []);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(null);
  const [locStatus, setLocStatus] = useState("unknown"); // unknown | undetermined | granted | denied

  const actionOpacity = busy ? 0.7 : 1;

  const loadUserId = useCallback(async () => {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.id ? Number(parsed.id) : null;
    } catch {
      return null;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        setLocStatus("denied");
        return;
      }

      const perm = await Location.getForegroundPermissionsAsync();
      const status = perm?.status;

      if (status === "granted") {
        setLocStatus("granted");
      } else if (status === "denied") {
        setLocStatus("denied");
      } else {
        setLocStatus("undetermined");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    if (busy) return;

    try {
      if (Platform.OS === "web") {
        Alert.alert("Location", "Location isn’t supported on web.");
        return;
      }

      if (!Number.isFinite(userId)) {
        Alert.alert("Location", "Please sign in again.");
        return;
      }

      setBusy(true);

      const current = await Location.getForegroundPermissionsAsync();
      const status = current?.status;

      // Only trigger system prompt when user taps.
      if (status === "undetermined") {
        const perm = await Location.requestForegroundPermissionsAsync();
        const next = perm?.status === "granted" ? "granted" : "denied";
        setLocStatus(next);

        if (next !== "granted") {
          Alert.alert(
            "Location",
            "No worries — you can still use the app. Turn this on anytime in settings.",
          );
          return;
        }
      } else if (status === "denied") {
        setLocStatus("denied");
        Alert.alert(
          "Location",
          "Location is turned off for Wifey. You can enable it in Settings.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                try {
                  Linking.openSettings();
                } catch (e) {
                  console.error(e);
                }
              },
            },
          ],
        );
        return;
      } else {
        // already granted
        setLocStatus("granted");
      }

      // If we reach here, permission is granted — save a location point.
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos?.coords?.latitude;
      const lng = pos?.coords?.longitude;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Could not read location coordinates");
      }

      const resp = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lat,
          lng,
        }),
      });

      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        throw new Error(json?.error || "Could not save your location");
      }

      setLocStatus("granted");
    } catch (e) {
      console.error(e);
      Alert.alert("Location", e?.message || "Could not enable location.");
    } finally {
      setBusy(false);
    }
  }, [busy, userId]);

  const finish = useCallback(async () => {
    try {
      await AsyncStorage.setItem(DONE_KEY, "true");
    } catch (e) {
      console.error(e);
    }
    router.replace("/home");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const id = await loadUserId();
        if (!cancelled) {
          setUserId(Number.isFinite(id) ? id : null);
        }

        // Only read status on load. Do NOT trigger native prompts here.
        await refreshStatus();
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [loadUserId, refreshStatus]);

  const locLabel =
    locStatus === "granted"
      ? "Enabled"
      : locStatus === "denied"
        ? "Not enabled"
        : "";

  const showPill = locLabel.length > 0;

  const allowLabel =
    locStatus === "denied"
      ? "Open Settings"
      : locStatus === "granted"
        ? "Update location"
        : "Allow";

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

      <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: "900",
            color: "#111",
            textAlign: "center",
          }}
        >
          Location
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "#6B7280",
            textAlign: "center",
            fontWeight: "700",
            lineHeight: 20,
          }}
        >
          Helps show you people near you and keeps the feed fresh.
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              Share location
            </Text>
            {showPill ? <StatusPill label={locLabel} kind={locStatus} /> : null}
          </View>

          <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
            We use your location to sort the feed by distance. We don’t show
            your exact location.
          </Text>

          <TouchableOpacity
            onPress={requestLocation}
            activeOpacity={0.9}
            disabled={busy}
            style={{
              marginTop: 16,
              borderRadius: 16,
              overflow: "hidden",
              opacity: actionOpacity,
            }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
                {allowLabel}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Card>
      </View>

      <View style={{ padding: 24, paddingBottom: insets.bottom + 24 }}>
        <TouchableOpacity
          onPress={finish}
          activeOpacity={0.9}
          style={{
            width: "100%",
            maxWidth: 340,
            alignSelf: "center",
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.72)",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.10)",
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#111", fontSize: 17, fontWeight: "900" }}>
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={finish}
          activeOpacity={0.85}
          style={{ paddingTop: 10, alignItems: "center" }}
        >
          <Text style={{ color: "#6B7280", fontSize: 13, fontWeight: "800" }}>
            Not now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
