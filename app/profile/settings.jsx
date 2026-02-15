import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  Bell,
  Shield,
  HelpCircle,
  Trash2,
  ChevronRight,
  Info,
  FileText,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];

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
        "[PUSH][SETTINGS] getExpoPushTokenAsync failed, retrying",
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

function SwitchRow({ icon: Icon, label, value, onValueChange, disabled }) {
  const trackColor = { false: "rgba(17,17,17,0.14)", true: "#FF4FD8" };
  const opacity = disabled ? 0.45 : 1;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        opacity,
      }}
    >
      {Icon ? <Icon size={20} color="#6B7280" /> : null}
      <Text
        style={{
          fontSize: 16,
          color: "#111",
          marginLeft: Icon ? 12 : 0,
          fontWeight: "700",
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Switch
        value={!!value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={trackColor}
        thumbColor="#ffffff"
        ios_backgroundColor="rgba(17,17,17,0.14)"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePrivacy = useCallback(() => {
    router.push("/profile/privacy");
  }, [router]);

  const handleHelp = useCallback(() => {
    Alert.alert("Help & Support", "Help center coming soon");
  }, []);

  const handleAbout = useCallback(() => {
    Alert.alert("About", "Version 1.0.0");
  }, []);

  const handleTerms = useCallback(() => {
    router.push("/profile/terms");
  }, [router]);

  const handleDeleteAccount = useCallback(() => {
    router.push("/profile/delete-account");
  }, [router]);

  const handleAdvancedPush = useCallback(() => {
    router.push("/profile/push-notifications");
  }, [router]);

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

  const initialDraft = useMemo(() => {
    const p = prefsQuery.data;
    if (!p) {
      return null;
    }
    return {
      enableAll: p.enableAll !== false,
      muteAll: p.muteAll === true,
      newLikes: p.newLikes !== false,
      newMatches: p.newMatches !== false,
      newMessages: p.newMessages !== false,
      promotions: p.promotions !== false,
      announcements: p.announcements !== false,
    };
  }, [prefsQuery.data]);

  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (draft) return;
    if (!initialDraft) return;
    setDraft(initialDraft);
  }, [draft, initialDraft]);

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

  const persist = useCallback(
    async (next) => {
      try {
        // If enabling notifications, ensure permissions + token registration.
        if (next?.enableAll && Number.isFinite(userId)) {
          const res = await ensurePushPermissionAndRegisterToken(userId);
          if (!res.ok) {
            Alert.alert(
              "Notifications",
              "To turn on notifications, please allow them in your phone settings.",
            );
            return;
          }
        }

        await saveMutation.mutateAsync(next);
      } catch (e) {
        console.error(e);
        Alert.alert(
          "Could not save",
          e?.message ||
            "Something went wrong saving your notification settings.",
        );
      }
    },
    [saveMutation, userId],
  );

  const setEnableAll = useCallback(
    async (value) => {
      const nextEnable = !!value;
      setDraft((prev) => {
        const p = prev || {};
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

      // persist from computed next state (avoid race)
      const next = nextEnable
        ? {
            ...(draft || {}),
            enableAll: true,
            muteAll: false,
            newLikes: true,
            newMatches: true,
            newMessages: true,
            promotions: true,
            announcements: true,
          }
        : {
            ...(draft || {}),
            enableAll: false,
            muteAll: false,
            newLikes: false,
            newMatches: false,
            newMessages: false,
            promotions: false,
            announcements: false,
          };

      await persist(next);
    },
    [draft, persist],
  );

  const setMuteAll = useCallback(
    async (value) => {
      const next = { ...(draft || {}), muteAll: !!value };
      setDraft(next);
      await persist(next);
    },
    [draft, persist],
  );

  const setField = useCallback(
    async (key, value) => {
      const next = { ...(draft || {}), [key]: !!value };
      setDraft(next);
      await persist(next);
    },
    [draft, persist],
  );

  const loadingNotif = userQuery.isLoading || prefsQuery.isLoading || !draft;
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

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
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
          <ArrowLeft size={20} color="#111" />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
          Settings
        </Text>

        <View style={{ width: 40, height: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Notifications Section (inline) */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 16, paddingBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Bell size={20} color="#6B7280" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#111",
                  marginLeft: 12,
                  fontWeight: "800",
                }}
              >
                Notifications
              </Text>
            </View>
            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              Choose what you want to be notified about.
            </Text>
          </View>

          {loadingNotif ? (
            <View style={{ padding: 16, paddingTop: 8, paddingBottom: 18 }}>
              <ActivityIndicator size="small" color="#A855F7" />
            </View>
          ) : (
            <View>
              <Divider />
              <SwitchRow
                label="Enable All Notifications"
                value={draft.enableAll}
                onValueChange={setEnableAll}
                disabled={saveMutation.isPending}
              />
              <Divider />
              <SwitchRow
                label="Mute All Notifications"
                value={draft.muteAll}
                onValueChange={setMuteAll}
                disabled={masterOff || saveMutation.isPending}
              />

              <Divider />
              <SwitchRow
                label="New Likes"
                value={draft.newLikes}
                onValueChange={(v) => setField("newLikes", v)}
                disabled={disableChildren || saveMutation.isPending}
              />
              <Divider />
              <SwitchRow
                label="New Matches"
                value={draft.newMatches}
                onValueChange={(v) => setField("newMatches", v)}
                disabled={disableChildren || saveMutation.isPending}
              />
              <Divider />
              <SwitchRow
                label="New Messages"
                value={draft.newMessages}
                onValueChange={(v) => setField("newMessages", v)}
                disabled={disableChildren || saveMutation.isPending}
              />
              <Divider />
              <SwitchRow
                label="Promotions"
                value={draft.promotions}
                onValueChange={(v) => setField("promotions", v)}
                disabled={disableChildren || saveMutation.isPending}
              />
              <Divider />
              <SwitchRow
                label="New people to swipe"
                value={draft.announcements}
                onValueChange={(v) => setField("announcements", v)}
                disabled={disableChildren || saveMutation.isPending}
              />

              <Divider />
              <TouchableOpacity
                onPress={handleAdvancedPush}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Bell size={20} color="#6B7280" />
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "900",
                        color: "#111",
                      }}
                    >
                      Push settings & testing
                    </Text>
                    <Text
                      style={{
                        marginTop: 2,
                        fontSize: 12,
                        color: "#6B7280",
                        fontWeight: "700",
                      }}
                    >
                      Send a test like/match notification
                    </Text>
                  </View>
                </View>

                <ChevronRight size={18} color="#C7C7CC" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Privacy & Security Section */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={handlePrivacy}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Shield size={20} color="#6B7280" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#111",
                  marginLeft: 12,
                  fontWeight: "700",
                }}
              >
                Privacy Policy
              </Text>
            </View>
            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={handleTerms}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <FileText size={20} color="#6B7280" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#111",
                  marginLeft: 12,
                  fontWeight: "700",
                }}
              >
                Terms & Conditions
              </Text>
            </View>
            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Help & Support Section */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={handleHelp}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <HelpCircle size={20} color="#6B7280" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#111",
                  marginLeft: 12,
                  fontWeight: "700",
                }}
              >
                Help & Support
              </Text>
            </View>
            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={handleAbout}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Info size={20} color="#6B7280" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#111",
                  marginLeft: 12,
                  fontWeight: "700",
                }}
              >
                About
              </Text>
            </View>
            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Deactivate Account Section */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#EF4444",
                  marginLeft: 12,
                  fontWeight: "800",
                }}
              >
                Deactivate account
              </Text>
            </View>
            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
