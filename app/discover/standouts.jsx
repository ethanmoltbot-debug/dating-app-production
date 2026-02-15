import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { useSubscription } from "@/utils/subscription";
import {
  DATING_PREFS_STORAGE_KEY,
  DEFAULT_DATING_PREFERENCES,
  normalizePrefsFromStorage,
} from "@/utils/datingPreferences";

const ACCENT = "#7C3AED";
const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];

function StandoutsRow({ item, onPress, blurred }) {
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
          blurRadius={blurred ? 18 : 0}
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

        {!blurred ? (
          <View
            style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}
          >
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
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function StandoutsFeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { isSerious, isCommitted } = useSubscription();
  const standoutsLocked = !isSerious;

  const standoutsTierParam = useMemo(() => {
    if (!isSerious) return "serious";
    if (isCommitted) return "committed";
    return "serious";
  }, [isCommitted, isSerious]);

  const openStandoutsUpsell = useCallback(() => {
    const qs = new URLSearchParams({
      returnTo: "/discover/standouts",
      intent: "standouts",
      tier: "serious",
    });
    router.push(`/subscription?${qs.toString()}`);
  }, [router]);

  // NEW: Serious users are capped to a small set; Committed can browse more.
  const openMoreStandoutsUpsell = useCallback(() => {
    const qs = new URLSearchParams({
      returnTo: "/discover/standouts",
      intent: "standouts_more",
      tier: "committed",
    });
    router.push(`/subscription?${qs.toString()}`);
  }, [router]);

  const standoutsLimit = useMemo(() => {
    if (isCommitted) return 40;
    return 5;
  }, [isCommitted]);

  const [userId, setUserId] = useState(null);
  const [genderPref, setGenderPref] = useState(
    DEFAULT_DATING_PREFERENCES.gender,
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rawUser = await AsyncStorage.getItem("user");
        const u = rawUser ? JSON.parse(rawUser) : null;

        const rawPrefs = await AsyncStorage.getItem(DATING_PREFS_STORAGE_KEY);
        const parsedPrefs = rawPrefs
          ? normalizePrefsFromStorage(JSON.parse(rawPrefs))
          : DEFAULT_DATING_PREFERENCES;

        if (!cancelled) {
          setUserId(u?.id || null);
          setGenderPref(
            parsedPrefs?.gender || DEFAULT_DATING_PREFERENCES.gender,
          );
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setUserId(null);
          setGenderPref(DEFAULT_DATING_PREFERENCES.gender);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [
      "discover",
      "standoutsFeed",
      userId,
      genderPref,
      standoutsLimit,
      standoutsTierParam,
    ],
    enabled: !!userId,
    queryFn: async () => {
      const qs = new URLSearchParams({
        userId: String(userId),
        limit: String(standoutsLimit),
        gender: String(genderPref || "all"),
        tier: String(standoutsTierParam),
      });
      const resp = await fetch(`/api/discover/standouts?${qs}`);
      if (!resp.ok) {
        let bodyText = "";
        try {
          bodyText = await resp.text();
        } catch {
          bodyText = "";
        }
        const extra = bodyText ? ` - ${bodyText.slice(0, 300)}` : "";
        throw new Error(
          `When fetching /api/discover/standouts, the response was [${resp.status}] ${resp.statusText}${extra}`,
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
      if (standoutsLocked) {
        openStandoutsUpsell();
        return;
      }
      router.push(`/profile/${id}`);
    },
    [openStandoutsUpsell, router, standoutsLocked],
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

        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
          Standouts
        </Text>

        <View style={{ width: 40, height: 40 }} />
      </View>

      {standoutsLocked ? (
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <View
            style={{
              padding: 16,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.84)",
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
            }}
          >
            <Text style={{ fontWeight: "900", color: "#111" }}>
              Standouts are for serious users.
            </Text>
            <Text style={{ marginTop: 6, color: "#6B7280", fontWeight: "700" }}>
              Upgrade to Serious to like and comment.
            </Text>
            <TouchableOpacity
              onPress={openStandoutsUpsell}
              activeOpacity={0.9}
              style={{
                marginTop: 12,
                backgroundColor: "#111",
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Upgrade to Serious
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* NEW: Serious tier cap message (only when they CAN see standouts, but are capped) */}
      {!standoutsLocked && !isCommitted ? (
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <View
            style={{
              padding: 16,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.84)",
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
            }}
          >
            <Text style={{ fontWeight: "900", color: "#111" }}>
              Want more standouts?
            </Text>
            <Text style={{ marginTop: 6, color: "#6B7280", fontWeight: "700" }}>
              Become Committed to see more than 5 standouts.
            </Text>
            <TouchableOpacity
              onPress={openMoreStandoutsUpsell}
              activeOpacity={0.9}
              style={{
                marginTop: 12,
                backgroundColor: "#111",
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Become Committed
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
            Couldn’t load standouts
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
          keyExtractor={(item) => `standouts-${item.id}`}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
          onRefresh={refetch}
          refreshing={isFetching}
          renderItem={({ item }) => (
            <StandoutsRow
              item={item}
              blurred={standoutsLocked}
              onPress={() => openProfile(item.id)}
            />
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
