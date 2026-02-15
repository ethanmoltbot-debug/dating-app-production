import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Clock } from "lucide-react-native";

function parseUntil(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

function diffParts(ms) {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

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

export default function CooldownScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const fromParam = parseUntil(params?.until || params?.cooldownUntil);
        if (fromParam) {
          if (!cancelled) setCooldownUntil(fromParam);
          return;
        }

        const userRaw = await AsyncStorage.getItem("user");
        if (!userRaw) {
          router.replace("/auth/login");
          return;
        }

        const user = JSON.parse(userRaw);
        const response = await fetch(`/api/users/me?userId=${user.id}`);
        if (!response.ok) {
          throw new Error(
            `When fetching /api/users/me, the response was [${response.status}] ${response.statusText}`,
          );
        }

        const json = await response.json();
        const until = parseUntil(json?.user?.cooldownUntil);
        if (!until) {
          // No cooldown on server anymore; send them to screening.
          router.replace("/screening/gate");
          return;
        }

        // Keep local cached user up to date.
        const nextUser = {
          ...(user || {}),
          ...(json.user || {}),
        };
        await AsyncStorage.setItem("user", JSON.stringify(nextUser));

        if (!cancelled) setCooldownUntil(until);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e?.message || "Could not load cooldown.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [params?.until, params?.cooldownUntil, router]);

  const msRemaining = useMemo(() => {
    if (!cooldownUntil) return 0;
    return cooldownUntil.getTime() - nowTick;
  }, [cooldownUntil, nowTick]);

  const remaining = useMemo(() => diffParts(msRemaining), [msRemaining]);

  const isDone = msRemaining <= 0;

  const bigNumber = isDone ? "0" : String(remaining.days);
  const subLabel = isDone
    ? "You can try again now"
    : remaining.days === 1
      ? "day remaining"
      : "days remaining";

  return (
    <View
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="dark" />

      <LinearGradient
        colors={["#F7EEFF", "#F2F7FF", "#FFF1F7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 28,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <Clock size={54} color="#7C3AED" />
        </View>

        <Text
          style={{
            fontSize: 30,
            fontWeight: "900",
            color: "#111",
            letterSpacing: 0.4,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Please wait
        </Text>

        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 22,
            paddingVertical: 18,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: "#111",
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 10,
              fontWeight: "900",
            }}
          >
            Wifey is built for people whose actions reduce doubt, not create it.
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#374151",
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 10,
            }}
          >
            Based on your answers, you may not be there yet.
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#374151",
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Retake the screening in{" "}
            <Text style={{ fontWeight: "900" }}>30 days</Text>.
          </Text>
        </View>

        <View
          style={{
            width: "100%",
            maxWidth: 340,
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 22,
            paddingVertical: 18,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
          }}
        >
          {loading ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator color="#7C3AED" />
            </View>
          ) : error ? (
            <Text
              style={{
                color: "#B91C1C",
                textAlign: "center",
                fontWeight: "800",
              }}
            >
              {error}
            </Text>
          ) : (
            <>
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <Text
                  style={{
                    fontSize: 64,
                    fontWeight: "900",
                    color: "#111",
                    lineHeight: 68,
                  }}
                >
                  {bigNumber}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: "#6B7280",
                    marginTop: 4,
                  }}
                >
                  {subLabel}
                </Text>
              </View>

              {!isDone && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 6,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        color: "#111",
                        fontSize: 22,
                        fontWeight: "900",
                      }}
                    >
                      {String(remaining.hours).padStart(2, "0")}
                    </Text>
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 12,
                        marginTop: 2,
                        fontWeight: "700",
                      }}
                    >
                      hours
                    </Text>
                  </View>

                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        color: "#111",
                        fontSize: 22,
                        fontWeight: "900",
                      }}
                    >
                      {String(remaining.minutes).padStart(2, "0")}
                    </Text>
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 12,
                        marginTop: 2,
                        fontWeight: "700",
                      }}
                    >
                      mins
                    </Text>
                  </View>

                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        color: "#111",
                        fontSize: 22,
                        fontWeight: "900",
                      }}
                    >
                      {String(remaining.seconds).padStart(2, "0")}
                    </Text>
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 12,
                        marginTop: 2,
                        fontWeight: "700",
                      }}
                    >
                      secs
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        <View style={{ height: 16 }} />

        <TouchableOpacity
          disabled={!isDone}
          onPress={() => router.replace("/screening/gate")}
          activeOpacity={0.9}
          style={{
            width: "100%",
            maxWidth: 340,
            borderRadius: 16,
            overflow: "hidden",
            opacity: isDone ? 1 : 0.6,
          }}
        >
          <LinearGradient
            colors={["#FF4FD8", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
              {isDone ? "Try the screening again" : "Come back later"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text
          style={{
            marginTop: 14,
            color: "#6B7280",
            fontSize: 13,
            textAlign: "center",
            paddingHorizontal: 10,
            fontWeight: "600",
          }}
        >
          This timer is tied to your account.
        </Text>
      </View>
    </View>
  );
}
