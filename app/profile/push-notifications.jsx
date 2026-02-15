import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

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

async function ensurePushPermissionAndRegisterToken(userId) {
  try {
    if (Platform.OS === "web") {
      return {
        ok: false,
        error: "Push notifications are not supported on web",
      };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const perms = await Notifications.getPermissionsAsync();
    let status = perms?.status;

    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req?.status;
    }

    if (status !== "granted") {
      return { ok: false, error: "Permission not granted" };
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      undefined;

    let tokenResp = null;
    try {
      tokenResp = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
    } catch (e) {
      console.error(
        "[PUSH][PUSH_NOTIF_SCREEN] getExpoPushTokenAsync failed, retrying",
        e,
      );
      tokenResp = await Notifications.getExpoPushTokenAsync();
    }

    const token = tokenResp?.data || null;
    if (!token) {
      return { ok: false, error: "Could not get Expo push token" };
    }

    const resp = await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        expoPushToken: token,
        platform: Platform.OS,
      }),
    });

    if (!resp.ok) {
      return {
        ok: false,
        error: `When registering /api/push/register, the response was [${resp.status}] ${resp.statusText}`,
      };
    }

    return { ok: true };
  } catch (e) {
    console.error("[PUSH][SETTINGS] register error", e);
    return { ok: false, error: e?.message || String(e) };
  }
}

function Row({ label, value, onValueChange, disabled }) {
  const opacity = disabled ? 0.45 : 1;
  const trackColor = { false: "rgba(17,17,17,0.14)", true: "#FF4FD8" };
  const thumbColor = "#ffffff";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        opacity,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>
        {label}
      </Text>
      <Switch
        value={!!value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={trackColor}
        thumbColor={thumbColor}
        ios_backgroundColor="rgba(17,17,17,0.14)"
      />
    </View>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: "rgba(255,255,255,0.86)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: "rgba(17,17,17,0.06)",
        marginLeft: 16,
      }}
    />
  );
}

export default function PushNotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const BG_GRADIENT = useMemo(() => ["#F7EEFF", "#F2F7FF", "#FFF1F7"], []);

  const [draft, setDraft] = useState(null);

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

  const prefsQuery = useQuery({
    queryKey: ["pushPrefs", userId],
    enabled: Number.isFinite(userId),
    queryFn: async () => {
      const resp = await fetch(`/api/push/preferences?userId=${userId}`);
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/push/preferences, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      const json = await resp.json();
      return json?.preferences || null;
    },
  });

  useEffect(() => {
    if (draft) return;
    const p = prefsQuery.data;
    if (!p) return;
    setDraft({
      enableAll: p.enableAll !== false,
      muteAll: p.muteAll === true,
      newLikes: p.newLikes !== false,
      newMatches: p.newMatches !== false,
      newMessages: p.newMessages !== false,
      promotions: p.promotions !== false,
      announcements: p.announcements !== false,
    });
  }, [draft, prefsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (nextPrefs) => {
      if (!Number.isFinite(userId)) {
        throw new Error("Missing user id");
      }

      const resp = await fetch("/api/push/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, preferences: nextPrefs }),
      });

      if (!resp.ok) {
        throw new Error(
          `When saving /api/push/preferences, the response was [${resp.status}] ${resp.statusText}`,
        );
      }

      return resp.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pushPrefs"] });
    },
  });

  const testPushMutation = useMutation({
    mutationFn: async (kind) => {
      if (!Number.isFinite(userId)) {
        throw new Error("Missing user id");
      }

      // Before testing, always (re)register the current device token.
      // This avoids testing against a stale token saved from a previous install/login.
      const reg = await ensurePushPermissionAndRegisterToken(userId);
      if (!reg.ok) {
        throw new Error(reg.error || "Could not register push token");
      }

      const safeKind =
        kind === "like" || kind === "match" || kind === "message"
          ? kind
          : "announcement";

      const resp = await fetch(
        `/api/push/test?userId=${encodeURIComponent(String(userId))}&kind=${encodeURIComponent(safeKind)}`,
      );

      const json = await resp.json().catch(() => null);

      if (!resp.ok) {
        const msg = json?.error || `Test push failed (${resp.status})`;
        throw new Error(msg);
      }

      return json;
    },
  });

  const sendTestPush = useCallback(
    async (kind) => {
      try {
        const res = await testPushMutation.mutateAsync(kind);

        const sendResults = Array.isArray(res?.sendResults)
          ? res.sendResults
          : [];
        const receiptAttempts = Array.isArray(res?.receiptAttempts)
          ? res.receiptAttempts
          : [];

        // Find the most informative receipt error from the *latest* attempt.
        const lastAttempt = receiptAttempts.length
          ? receiptAttempts[receiptAttempts.length - 1]
          : null;
        const receiptData = lastAttempt?.response?.data || null;
        const firstReceipt = receiptData ? Object.values(receiptData)[0] : null;

        const firstSend = sendResults.length ? sendResults[0] : null;
        const sendOk = !!firstSend?.ok;
        const sendProblem = firstSend?.response
          ? JSON.stringify(firstSend.response)
          : firstSend?.httpStatus
            ? `[${firstSend.httpStatus}] ${firstSend.httpStatusText}`
            : null;

        if (firstReceipt?.status === "error") {
          const details = String(firstReceipt?.message || "Unknown error");
          Alert.alert(
            "Push delivery failed",
            `${details}\n\nThis usually means APNs credentials aren’t set for the TestFlight build, or the device token is not registered.`,
          );
          return;
        }

        if (!sendOk) {
          Alert.alert(
            "Test push failed",
            sendProblem || "Expo rejected the push request.",
          );
          return;
        }

        const attemptsNote = receiptAttempts.length
          ? `Checked receipts ${receiptAttempts.length}x (up to ~${Math.round((receiptAttempts[receiptAttempts.length - 1].delayMs || 0) / 1000)}s).`
          : "";

        Alert.alert(
          "Test push sent",
          attemptsNote ||
            "If notifications are enabled on your phone, you should see it soon.",
        );
      } catch (e) {
        console.error(e);
        Alert.alert("Test push failed", e?.message || "Please try again.");
      }
    },
    [testPushMutation],
  );

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  const onDone = useCallback(async () => {
    try {
      if (!draft) {
        router.back();
        return;
      }

      // If enabling notifications, ensure permissions + token registration.
      if (draft.enableAll && Number.isFinite(userId)) {
        const res = await ensurePushPermissionAndRegisterToken(userId);
        if (!res.ok) {
          Alert.alert(
            "Notifications",
            "To turn on notifications, please allow them in your phone settings.",
          );
          return;
        }
      }

      await saveMutation.mutateAsync(draft);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Could not save",
        e?.message || "Something went wrong saving your notification settings.",
      );
    }
  }, [draft, router, saveMutation, userId]);

  const setEnableAll = useCallback(
    (value) => {
      setDraft((prev) => {
        const p = prev || {};
        const nextEnable = !!value;

        if (!nextEnable) {
          return {
            ...p,
            enableAll: false,
            muteAll: false,
            newLikes: false,
            newMatches: false,
            newMessages: false,
            promotions: false,
            announcements: false,
          };
        }

        return {
          ...p,
          enableAll: true,
          muteAll: false,
          newLikes: true,
          newMatches: true,
          newMessages: true,
          promotions: true,
          announcements: true,
        };
      });
    },
    [setDraft],
  );

  const setMuteAll = useCallback((value) => {
    setDraft((prev) => ({
      ...(prev || {}),
      muteAll: !!value,
    }));
  }, []);

  const setField = useCallback((key, value) => {
    setDraft((prev) => ({
      ...(prev || {}),
      [key]: !!value,
    }));
  }, []);

  const loading = userQuery.isLoading || prefsQuery.isLoading || !draft;

  const masterOff = !!draft && draft.enableAll === false;
  const muted = !!draft && draft.muteAll === true;
  const disableChildren = masterOff || muted;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      {/* Top bar */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity onPress={onCancel} style={{ paddingVertical: 6 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
            Push Notifications
          </Text>

          <TouchableOpacity
            onPress={onDone}
            style={{
              paddingVertical: 6,
              opacity: saveMutation.isPending ? 0.6 : 1,
            }}
            disabled={saveMutation.isPending}
          >
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#7C3AED" }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ paddingTop: 50, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#A855F7" />
          </View>
        ) : (
          <View>
            <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                Choose what you want to be notified about.
              </Text>
            </View>

            <Card>
              <Row
                label="Enable All Notifications"
                value={draft.enableAll}
                onValueChange={setEnableAll}
                disabled={false}
              />
              <Divider />
              <Row
                label="Mute All Notifications"
                value={draft.muteAll}
                onValueChange={setMuteAll}
                disabled={masterOff}
              />
            </Card>

            <View
              style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 6 }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: "rgba(17,17,17,0.45)",
                  letterSpacing: 0.6,
                }}
              >
                NOTIFY ME ABOUT
              </Text>
            </View>

            <Card>
              <Row
                label="New Likes"
                value={draft.newLikes}
                onValueChange={(v) => setField("newLikes", v)}
                disabled={disableChildren}
              />
              <Divider />
              <Row
                label="New Matches"
                value={draft.newMatches}
                onValueChange={(v) => setField("newMatches", v)}
                disabled={disableChildren}
              />
              <Divider />
              <Row
                label="New Messages"
                value={draft.newMessages}
                onValueChange={(v) => setField("newMessages", v)}
                disabled={disableChildren}
              />
            </Card>

            <Card>
              <Row
                label="Promotions"
                value={draft.promotions}
                onValueChange={(v) => setField("promotions", v)}
                disabled={disableChildren}
              />
              <Divider />
              <Row
                label="New people to swipe"
                value={draft.announcements}
                onValueChange={(v) => setField("announcements", v)}
                disabled={disableChildren}
              />
            </Card>

            {/* NEW: lightweight debug tool for TestFlight */}
            <View
              style={{
                paddingHorizontal: 18,
                paddingTop: 18,
                paddingBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: "rgba(17,17,17,0.45)",
                  letterSpacing: 0.6,
                }}
              >
                TEST
              </Text>
            </View>

            <Card>
              <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "900", color: "#111" }}
                >
                  Send a test notification
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#6B7280",
                    lineHeight: 16,
                  }}
                >
                  This helps confirm TestFlight can receive push notifications
                  on this device.
                </Text>

                <View style={{ height: 12 }} />

                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={() => sendTestPush("like")}
                    disabled={testPushMutation.isPending}
                    activeOpacity={0.9}
                    style={{
                      flex: 1,
                      marginRight: 10,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                      backgroundColor: "rgba(255,79,216,0.14)",
                      borderWidth: 1,
                      borderColor: "rgba(255,79,216,0.22)",
                      opacity: testPushMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: "#9D174D", fontWeight: "900" }}>
                      Test Like
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => sendTestPush("match")}
                    disabled={testPushMutation.isPending}
                    activeOpacity={0.9}
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                      backgroundColor: "rgba(124,58,237,0.14)",
                      borderWidth: 1,
                      borderColor: "rgba(124,58,237,0.22)",
                      opacity: testPushMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: "#5B21B6", fontWeight: "900" }}>
                      Test Match
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            <View style={{ paddingHorizontal: 18, paddingTop: 6 }}>
              <Text style={{ fontSize: 12, color: "#6B7280", lineHeight: 16 }}>
                Turn this on to get a ping when new people are available in the
                feed.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
