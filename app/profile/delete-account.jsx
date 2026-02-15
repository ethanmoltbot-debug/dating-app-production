import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  Trash2,
  ShieldAlert,
  ChevronRight,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

function formatDateShort(d) {
  try {
    const dt = new Date(d);
    if (!Number.isFinite(dt.getTime())) return null;
    return dt.toLocaleDateString();
  } catch {
    return null;
  }
}

function calcDaysLeft(scheduledFor) {
  try {
    const dt = new Date(scheduledFor);
    if (!Number.isFinite(dt.getTime())) return null;
    const diff = dt.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  } catch {
    return null;
  }
}

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const statusQuery = useQuery({
    queryKey: ["accountDeletion", userId],
    enabled: Number.isFinite(userId),
    queryFn: async () => {
      const resp = await fetch(`/api/users/delete/status?userId=${userId}`);
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/users/delete/status, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      return resp.json();
    },
    refetchOnWindowFocus: true,
  });

  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      if (!Number.isFinite(userId)) {
        throw new Error("Missing user id");
      }
      const resp = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!resp.ok) {
        const msg = await resp.json().catch(() => null);
        throw new Error(msg?.error || "Could not request account deletion");
      }
      return resp.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accountDeletion"] });
    },
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: async () => {
      if (!Number.isFinite(userId)) {
        throw new Error("Missing user id");
      }
      const resp = await fetch("/api/users/delete/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!resp.ok) {
        const msg = await resp.json().catch(() => null);
        throw new Error(msg?.error || "Could not cancel account deletion");
      }
      return resp.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accountDeletion"] });
    },
  });

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const deletionStatus = statusQuery.data?.status || "unknown";
  const scheduledFor = statusQuery.data?.deleteScheduledFor || null;

  const scheduledForText = useMemo(() => {
    if (!scheduledFor) return null;
    return formatDateShort(scheduledFor);
  }, [scheduledFor]);

  const daysLeft = useMemo(() => {
    if (!scheduledFor) return null;
    return calcDaysLeft(scheduledFor);
  }, [scheduledFor]);

  const requestDeletion = useCallback(() => {
    Alert.alert(
      "Deactivate account",
      "This will start a 30-day deactivation window. You can reactivate anytime during those 30 days by signing back in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Last check",
              "After this, your account is scheduled to deactivate. You will be signed out.",
              [
                { text: "Not now", style: "cancel" },
                {
                  text: "Deactivate",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await requestDeletionMutation.mutateAsync();
                      await AsyncStorage.removeItem("user");
                      router.replace("/auth/login");
                    } catch (e) {
                      console.error(e);
                      Alert.alert(
                        "Could not deactivate",
                        e?.message || "Please try again.",
                      );
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [requestDeletionMutation, router]);

  const cancelDeletion = useCallback(async () => {
    try {
      await cancelDeletionMutation.mutateAsync();
      Alert.alert(
        "Account reactivated",
        "Your deactivation request has been cancelled.",
      );
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Could not cancel",
        e?.message || "Please try again in a moment.",
      );
    }
  }, [cancelDeletionMutation]);

  const isBusy =
    userQuery.isLoading ||
    statusQuery.isLoading ||
    requestDeletionMutation.isPending ||
    cancelDeletionMutation.isPending;

  const cardTitle = useMemo(() => {
    if (deletionStatus === "pending") return "Deactivation requested";
    if (deletionStatus === "deleted") return "Account deactivated";
    return "Deactivate account";
  }, [deletionStatus]);

  const cardBody = useMemo(() => {
    if (deletionStatus === "pending") {
      const lineA = scheduledForText
        ? `Deactivates on: ${scheduledForText}`
        : "Scheduled to deactivate";

      const lineB =
        typeof daysLeft === "number"
          ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to reactivate`
          : "You can reactivate it within 30 days.";

      return { lineA, lineB };
    }

    if (deletionStatus === "deleted") {
      return {
        lineA: "This account has been deactivated.",
        lineB: "If you meant to restore it, the 30-day window may have passed.",
      };
    }

    return {
      lineA: "You can deactivate your account with a 30-day recovery window.",
      lineB:
        "If you change your mind, just sign back in within 30 days to reactivate it.",
    };
  }, [daysLeft, deletionStatus, scheduledForText]);

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
          onPress={goBack}
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
          Account
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
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ShieldAlert size={20} color="#EF4444" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#111",
                  marginLeft: 12,
                  fontWeight: "900",
                }}
              >
                {cardTitle}
              </Text>
            </View>

            <Text
              style={{
                marginTop: 10,
                fontSize: 14,
                color: "#6B7280",
                lineHeight: 20,
              }}
            >
              {cardBody.lineA}
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                color: "#6B7280",
                lineHeight: 20,
              }}
            >
              {cardBody.lineB}
            </Text>

            {isBusy ? (
              <View style={{ marginTop: 14, alignItems: "flex-start" }}>
                <ActivityIndicator size="small" color="#A855F7" />
              </View>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        {deletionStatus === "pending" ? (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.86)",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <TouchableOpacity
              onPress={cancelDeletion}
              disabled={cancelDeletionMutation.isPending}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                justifyContent: "space-between",
                opacity: cancelDeletionMutation.isPending ? 0.6 : 1,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "900", color: "#111" }}
                >
                  Cancel deactivation
                </Text>
              </View>
              <ChevronRight size={18} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        ) : null}

        {deletionStatus !== "pending" && deletionStatus !== "deleted" ? (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.86)",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <TouchableOpacity
              onPress={requestDeletion}
              disabled={requestDeletionMutation.isPending}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                justifyContent: "space-between",
                opacity: requestDeletionMutation.isPending ? 0.6 : 1,
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
                    fontWeight: "900",
                  }}
                >
                  Deactivate account
                </Text>
              </View>
              <ChevronRight size={18} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
