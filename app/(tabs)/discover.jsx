import { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react-native";
import { useSubscription } from "@/utils/subscription";
import {
  DATING_PREFS_STORAGE_KEY,
  DEFAULT_DATING_PREFERENCES,
  normalizePrefsFromStorage,
} from "@/utils/datingPreferences";
import { formatCategoryWithEmoji } from "@/utils/categoryEmojis";

const ACCENT = "#7C3AED";
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

function extractPromptLine(preferences) {
  const list = Array.isArray(preferences?.prompts) ? preferences.prompts : [];
  const first = list?.[0];
  const answer = typeof first?.answer === "string" ? first.answer.trim() : "";
  if (answer) {
    return answer;
  }
  const bio =
    typeof preferences?.bio === "string" ? preferences.bio.trim() : "";
  return bio;
}

function StandoutCard({ profile, width, onPress, blurred }) {
  const photo = Array.isArray(profile?.photos) ? profile.photos?.[0] : null;
  const name = profile?.display_name || "";
  const ageText = profile?.age ? String(profile.age) : "";
  const location =
    typeof profile?.location === "string" ? profile.location : "";

  const promptLine = useMemo(() => {
    const line = extractPromptLine(profile?.preferences);
    return typeof line === "string" ? line : "";
  }, [profile?.preferences]);

  const subtitle = useMemo(() => {
    if (ageText) {
      return `${name}, ${ageText}`;
    }
    return name;
  }, [ageText, name]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={{
        width,
        height: 220,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      <Image
        source={{ uri: photo || "https://via.placeholder.com/600" }}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        resizeMode="cover"
        blurRadius={blurred ? 18 : 0}
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.72)"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
        }}
      />

      {/* Hide text details when blurred (keeps it clean + matches the lock vibe) */}
      {!blurred ? (
        <View style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
          <Text
            style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}
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
            <View
              style={{
                marginTop: 8,
                backgroundColor: "rgba(255,255,255,0.16)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 14,
              }}
            >
              <Text
                style={{ color: "#fff", fontWeight: "800" }}
                numberOfLines={1}
              >
                {promptLine}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function CategoryTile({ item, width, onPress }) {
  const cover = item?.cover_photo_url || null;
  const title = String(item?.category || "");
  const serverEmoji = String(item?.emoji || "").trim();

  const titleWithEmoji = useMemo(() => {
    const trimmed = String(title || "").trim();
    if (!trimmed) return "";
    if (serverEmoji) return `${serverEmoji} ${trimmed}`;
    return formatCategoryWithEmoji(trimmed);
  }, [serverEmoji, title]);

  const count = Number(item?.count);
  const showCount = Number.isFinite(count) && count > 0;
  const countLabel = showCount ? `${count} women` : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={{
        width,
        height: 150,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.08)",
      }}
    >
      <Image
        source={{ uri: cover || "https://via.placeholder.com/600" }}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        resizeMode="cover"
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.70)"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 90,
        }}
      />

      <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
        <Text
          style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}
          numberOfLines={1}
        >
          {titleWithEmoji}
        </Text>
        {countLabel ? (
          <Text
            style={{
              marginTop: 4,
              color: "rgba(255,255,255,0.82)",
              fontWeight: "700",
              fontSize: 12,
            }}
            numberOfLines={1}
          >
            {countLabel}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width: screenWidth } = useWindowDimensions();

  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_DATING_PREFERENCES);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rawUser = await AsyncStorage.getItem("user");
        const parsedUser = rawUser ? JSON.parse(rawUser) : null;

        const rawPrefs = await AsyncStorage.getItem(DATING_PREFS_STORAGE_KEY);
        const parsedPrefs = rawPrefs
          ? normalizePrefsFromStorage(JSON.parse(rawPrefs))
          : DEFAULT_DATING_PREFERENCES;

        if (!cancelled) {
          setUser(parsedUser);
          setPrefs(parsedPrefs);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setUser(null);
          setPrefs(DEFAULT_DATING_PREFERENCES);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const userId = user?.id;

  const { isSerious, isCommitted } = useSubscription();
  const standoutsLocked = !isSerious;

  const standoutsTierParam = useMemo(() => {
    // If they aren't Serious yet, keep request small.
    if (!isSerious) return "serious";
    if (isCommitted) return "committed";
    return "serious";
  }, [isCommitted, isSerious]);

  // Serious users see a small set; Committed can browse a bigger set.
  // (Locked users still see blurred cards, but we keep the request small.)
  const standoutsLimit = useMemo(() => {
    if (isCommitted) return 12;
    return 5;
  }, [isCommitted]);

  const standoutsQuery = useQuery({
    queryKey: [
      "discover",
      "standouts",
      userId,
      prefs?.gender,
      standoutsLimit,
      standoutsTierParam,
    ],
    enabled: !!userId,
    queryFn: async () => {
      const qs = new URLSearchParams({
        userId: String(userId),
        limit: String(standoutsLimit),
        gender: String(prefs?.gender || "all"),
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

  const categoriesQuery = useQuery({
    queryKey: ["discover", "categories", userId],
    enabled: !!userId,
    queryFn: async () => {
      const qs = new URLSearchParams({ userId: String(userId) });
      const resp = await fetch(`/api/discover/categories?${qs}`);
      if (!resp.ok) {
        let bodyText = "";
        try {
          bodyText = await resp.text();
        } catch {
          bodyText = "";
        }
        const extra = bodyText ? ` - ${bodyText.slice(0, 300)}` : "";
        throw new Error(
          `When fetching /api/discover/categories, the response was [${resp.status}] ${resp.statusText}${extra}`,
        );
      }
      const json = await resp.json();
      return Array.isArray(json?.categories) ? json.categories : [];
    },
  });

  const refreshing = standoutsQuery.isFetching || categoriesQuery.isFetching;
  const loading = standoutsQuery.isLoading || categoriesQuery.isLoading;
  // Remove user-facing error message; keep errors out of the UI.

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    try {
      await queryClient.invalidateQueries({
        queryKey: ["discover", "standouts", userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["discover", "categories", userId],
      });
    } catch (e) {
      console.error(e);
    }
  }, [queryClient, userId]);

  const standouts = standoutsQuery.data || [];
  const categories = categoriesQuery.data || [];

  const standoutCardWidth = Math.min(320, Math.max(260, screenWidth - 80));
  const tileGap = 12;
  const gridPadding = 16;
  const tileWidth = Math.floor((screenWidth - gridPadding * 2 - tileGap) / 2);

  const goToProfile = useCallback(
    (id) => {
      router.push(`/profile/${id}`);
    },
    [router],
  );

  const openStandoutsUpsell = useCallback(() => {
    const qs = new URLSearchParams({
      returnTo: "/discover",
      intent: "standouts",
      tier: "serious",
    });
    router.push(`/subscription?${qs.toString()}`);
  }, [router]);

  const openStandoutsFeed = useCallback(() => {
    if (standoutsLocked) {
      openStandoutsUpsell();
      return;
    }
    router.push("/discover/standouts");
  }, [openStandoutsUpsell, router, standoutsLocked]);

  const openCategory = useCallback(
    (categoryName) => {
      const encoded = encodeURIComponent(String(categoryName || "").trim());
      router.push(`/discover/category/${encoded}`);
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
      <SoftBlobsBackground />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 34 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
          />
        }
      >
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 34, fontWeight: "900", color: "#111" }}>
            Discover
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", fontWeight: "700" }}>
            Curated picks + fun browsing.
          </Text>
        </View>

        {/* Standouts */}
        <View style={{ marginTop: 18 }}>
          <View
            style={{
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              Standouts
            </Text>

            <TouchableOpacity
              onPress={openStandoutsFeed}
              activeOpacity={0.85}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={{ color: ACCENT, fontWeight: "900" }}>See all</Text>
              <ChevronRight size={18} color={ACCENT} />
            </TouchableOpacity>
          </View>

          {standoutsLocked ? (
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
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
                <Text
                  style={{
                    marginTop: 6,
                    color: "#6B7280",
                    fontWeight: "700",
                    lineHeight: 18,
                  }}
                >
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

          {loading ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color={ACCENT} />
            </View>
          ) : standouts.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingRight: 24,
                gap: 12,
              }}
              style={{ flexGrow: 0 }}
            >
              {standouts.map((p) => {
                const onPress = standoutsLocked
                  ? openStandoutsUpsell
                  : () => goToProfile(p.id);

                return (
                  <StandoutCard
                    key={`standout-${p.id}`}
                    profile={p}
                    width={standoutCardWidth}
                    onPress={onPress}
                    blurred={standoutsLocked}
                  />
                );
              })}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
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
                  No standouts yet
                </Text>
                <Text
                  style={{ marginTop: 6, color: "#6B7280", fontWeight: "700" }}
                >
                  Pull to refresh or try again later.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Categories */}
        <View style={{ marginTop: 26, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
            Browse by Category
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", fontWeight: "700" }}>
            Explore profiles by vibe.
          </Text>

          {categories.length ? (
            <View
              style={{
                marginTop: 14,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: tileGap,
              }}
            >
              {categories.map((c) => (
                <CategoryTile
                  key={`cat-${c.category}`}
                  item={c}
                  width={tileWidth}
                  onPress={() => openCategory(c.category)}
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                marginTop: 14,
                padding: 16,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.84)",
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.06)",
              }}
            >
              <Text style={{ fontWeight: "900", color: "#111" }}>
                No categories yet
              </Text>
              <Text
                style={{ marginTop: 6, color: "#6B7280", fontWeight: "700" }}
              >
                Categories only show up when at least one verified woman selects
                that category.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
