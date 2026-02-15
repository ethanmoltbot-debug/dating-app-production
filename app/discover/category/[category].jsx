import { useCallback, useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { formatCategoryWithEmoji } from "@/utils/categoryEmojis";

const ACCENT = "#7C3AED";
const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];

function ProfileRow({ item, onPress }) {
  const photo = Array.isArray(item?.photos) ? item.photos?.[0] : null;
  const title = item?.display_name || "";
  const age = item?.age ? String(item.age) : "";
  const location = item?.location || "";

  const promptLine = useMemo(() => {
    const prefs = item?.preferences;
    const prompts = Array.isArray(prefs?.prompts) ? prefs.prompts : [];
    const first = prompts?.[0];
    const answer = typeof first?.answer === "string" ? first.answer.trim() : "";
    return answer;
  }, [item?.preferences]);

  const subtitle = age ? `${title}, ${age}` : title;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={{
        marginBottom: 14,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.08)",
      }}
    >
      <View style={{ height: 260, backgroundColor: "#111" }}>
        <Image
          source={{ uri: photo || "https://via.placeholder.com/700" }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
          resizeMode="cover"
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.78)"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 140,
          }}
        />

        <View style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
          <Text
            style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
          {location ? (
            <Text
              style={{
                marginTop: 4,
                color: "rgba(255,255,255,0.82)",
                fontWeight: "700",
              }}
              numberOfLines={1}
            >
              {location}
            </Text>
          ) : null}
          {promptLine ? (
            <Text
              style={{
                marginTop: 8,
                color: "rgba(255,255,255,0.92)",
                fontWeight: "800",
              }}
              numberOfLines={2}
            >
              “{promptLine}”
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CategoryFeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [userId, setUserId] = useState(null);

  const categoryParam = useMemo(() => {
    const raw = params?.category;
    const val = Array.isArray(raw) ? raw[0] : raw;
    try {
      return decodeURIComponent(String(val || ""));
    } catch {
      return String(val || "");
    }
  }, [params?.category]);

  const categoryTitle = useMemo(() => {
    return formatCategoryWithEmoji(categoryParam || "");
  }, [categoryParam]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rawUser = await AsyncStorage.getItem("user");
        const u = rawUser ? JSON.parse(rawUser) : null;
        if (!cancelled) {
          setUserId(u?.id || null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setUserId(null);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["discover", "categoryFeed", userId, categoryParam],
    enabled: !!userId && !!categoryParam,
    queryFn: async () => {
      const qs = new URLSearchParams({
        userId: String(userId),
        category: String(categoryParam),
        limit: "50",
      });
      const resp = await fetch(`/api/discover/category-feed?${qs}`);
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/discover/category-feed, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      const json = await resp.json();
      return Array.isArray(json?.profiles) ? json.profiles : [];
    },
  });

  const profiles = data || [];

  const onBack = useCallback(() => router.back(), [router]);

  const openProfile = useCallback(
    (id) => {
      router.push(`/profile/${id}`);
    },
    [router],
  );

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

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
          onPress={onBack}
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

        <Text
          style={{
            fontSize: 18,
            fontWeight: "900",
            color: "#111",
            maxWidth: 240,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {categoryTitle || "Category"}
        </Text>

        <View style={{ width: 40, height: 40 }} />
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : error ? (
        <View
          style={{ flex: 1, paddingHorizontal: 18, justifyContent: "center" }}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
            Couldn’t load this category
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", fontWeight: "700" }}>
            {error?.message || "Please try again."}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.9}
            style={{
              marginTop: 14,
              backgroundColor: ACCENT,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => `category-${categoryParam}-${item.id}`}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
          onRefresh={refetch}
          refreshing={isFetching}
          renderItem={({ item }) => (
            <ProfileRow item={item} onPress={() => openProfile(item.id)} />
          )}
          ListEmptyComponent={
            <View
              style={{
                marginTop: 24,
                padding: 16,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.84)",
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.06)",
              }}
            >
              <Text style={{ fontWeight: "900", color: "#111" }}>
                Nothing here right now
              </Text>
              <Text
                style={{ marginTop: 6, color: "#6B7280", fontWeight: "700" }}
              >
                Pull down to refresh.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
