import { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react-native";
import { ProfilePreviewContent } from "@/components/ProfilePreview/ProfilePreviewContent";

const ACCENT = "#FF1744";

export default function ProfilePreviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["profile", "me", "preview"],
    queryFn: async () => {
      const userRaw = await AsyncStorage.getItem("user");
      if (!userRaw) {
        throw new Error("You're not signed in.");
      }
      const user = JSON.parse(userRaw);

      const response = await fetch(`/api/profile/me?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(
          `When fetching /api/profile/me, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const json = await response.json();
      return { user, profile: json.profile };
    },
  });

  const profile = data?.profile;

  const preferences = useMemo(() => {
    const raw = profile?.preferences;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }, [profile?.preferences]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onEdit = useCallback(() => {
    router.push("/profile/edit");
  }, [router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: insets.top,
        }}
      >
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error) {
    const errorMsg = error?.message || "Please try again.";

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: insets.top,
          paddingHorizontal: 18,
          justifyContent: "center",
        }}
      >
        <StatusBar style="dark" />
        <Text style={{ color: "#111", fontSize: 18, fontWeight: "600" }}>
          Could not load preview
        </Text>
        <Text style={{ color: "#6B7280", marginTop: 8 }}>{errorMsg}</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{
            marginTop: 16,
            backgroundColor: ACCENT,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onBack}
          style={{
            marginTop: 10,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E5E5EA",
          }}
        >
          <Text style={{ color: "#111", fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: insets.top,
          paddingHorizontal: 18,
          justifyContent: "center",
        }}
      >
        <StatusBar style="dark" />
        <Text style={{ color: "#111", fontSize: 18, fontWeight: "600" }}>
          No profile yet
        </Text>
        <Text style={{ color: "#6B7280", marginTop: 8 }}>
          Add a photo and a short bio, then come back to preview.
        </Text>
        <TouchableOpacity
          onPress={onEdit}
          style={{
            marginTop: 16,
            backgroundColor: ACCENT,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Edit profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E5EA",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>
          Preview
        </Text>

        <TouchableOpacity
          onPress={onEdit}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#E5E5EA",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pencil size={16} color="#111" />
            <Text style={{ color: "#111", fontWeight: "600" }}>Edit</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ProfilePreviewContent
        profile={profile}
        preferences={preferences}
        bottomInset={insets.bottom}
        viewerUserId={data?.user?.id}
      />
    </View>
  );
}
