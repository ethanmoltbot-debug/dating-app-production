import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChevronLeft,
  RotateCcw,
  ChevronRight,
  Lock,
} from "lucide-react-native";
import {
  DATING_PREFS_STORAGE_KEY,
  DEFAULT_DATING_PREFERENCES,
  normalizePrefsFromStorage,
  prefsSummary,
} from "@/utils/datingPreferences";
import { useSubscription } from "@/utils/subscription";

function FilterSection({ title, children }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "400",
          color: "#8E8E93",
          letterSpacing: 0.4,
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#E5E5EA",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function NavRow({ title, value, onPress, isLast }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#E5E5EA",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "400", color: "#111" }}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "400",
            color: "#6B7280",
            maxWidth: 180,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
        <ChevronRight size={18} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

function LockedRow({ title, onPress, isLast }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#E5E5EA",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "400", color: "#111" }}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: "400", color: "#8E8E93" }}>
          Membership
        </Text>
        <Lock size={16} color="#C7C7CC" />
        <ChevronRight size={18} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [prefs, setPrefs] = useState(DEFAULT_DATING_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const { isPro, loading: subLoading } = useSubscription();

  const premiumKeys = useMemo(
    () => [
      "height",
      "relationshipType",
      "familyPlans",
      "education",
      "religion",
      "politics",
      "drinking",
      "smoking",
      "marijuana",
      "drugs",
    ],
    [],
  );

  const premiumPreviewGroups = useMemo(
    () => [
      {
        title: "Dating",
        rows: [
          { key: "height", label: "Height range" },
          { key: "relationshipType", label: "Relationship type" },
          { key: "familyPlans", label: "Family plans" },
          { key: "education", label: "Education" },
          { key: "religion", label: "Religion" },
          { key: "politics", label: "Politics" },
        ],
      },
      {
        title: "Lifestyle",
        rows: [
          { key: "drinking", label: "Drinking" },
          { key: "smoking", label: "Smoking" },
          { key: "marijuana", label: "Marijuana" },
          { key: "drugs", label: "Drugs" },
        ],
      },
    ],
    [],
  );

  useEffect(() => {
    const load = async () => {
      try {
        // Backward-compat: if old key exists, migrate into the new key.
        const legacy = await AsyncStorage.getItem("profileFilters");
        const raw = await AsyncStorage.getItem(DATING_PREFS_STORAGE_KEY);

        const parsed = raw ? JSON.parse(raw) : null;
        let normalized = normalizePrefsFromStorage(parsed);

        if (!raw && legacy) {
          const legacyParsed = JSON.parse(legacy);
          normalized = normalizePrefsFromStorage({
            ...normalized,
            ...(legacyParsed || {}),
          });
          await AsyncStorage.setItem(
            DATING_PREFS_STORAGE_KEY,
            JSON.stringify(normalized),
          );
        }

        setPrefs(normalized);
      } catch (e) {
        console.error(e);
        setPrefs(DEFAULT_DATING_PREFERENCES);
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, []);

  const refreshFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(DATING_PREFS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      setPrefs(normalizePrefsFromStorage(parsed));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Re-sync after returning from detail screens
  useEffect(() => {
    const unsub = router.addListener?.("focus", refreshFromStorage);
    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, [router, refreshFromStorage]);

  const reset = useCallback(async () => {
    try {
      setPrefs(DEFAULT_DATING_PREFERENCES);
      await AsyncStorage.setItem(
        DATING_PREFS_STORAGE_KEY,
        JSON.stringify(DEFAULT_DATING_PREFERENCES),
      );
      // also reset legacy for feed code paths that still read it
      await AsyncStorage.setItem(
        "profileFilters",
        JSON.stringify({
          minAge: DEFAULT_DATING_PREFERENCES.minAge,
          maxAge: DEFAULT_DATING_PREFERENCES.maxAge,
          maxDistance: DEFAULT_DATING_PREFERENCES.maxDistance,
          gender: DEFAULT_DATING_PREFERENCES.gender,
        }),
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  const done = useCallback(() => {
    router.back();
  }, [router]);

  const valueFor = useCallback(
    (key) => {
      const v = prefsSummary(key, prefs);
      const deal = prefs.dealbreakers?.[key] ? " • Dealbreaker" : "";
      return `${v}${deal}`;
    },
    [prefs],
  );

  const go = (key) => router.push(`/filters/${key}`);

  const goSubscribe = useCallback(
    (returnTo) => {
      const encoded = encodeURIComponent(returnTo);
      router.push(`/subscription?returnTo=${encoded}`);
    },
    [router],
  );

  const openPremium = useCallback(async () => {
    // Always go to our custom subscription page (week / month / 6 months)
    goSubscribe("/filters");
  }, [goSubscribe]);

  const handlePressPreference = useCallback(
    async (key) => {
      const isPremium = premiumKeys.includes(key);
      if (!isPremium) {
        go(key);
        return;
      }

      // Premium key
      if (isPro) {
        go(key);
        return;
      }

      // Not Pro: send them to subscription page, then back to the preference.
      goSubscribe(`/filters/${key}`);
    },
    [go, goSubscribe, isPro, premiumKeys],
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F2F2F7", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Top Nav */}
      <View
        style={{
          backgroundColor: "#F2F2F7",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E5EA",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            padding: 8,
          }}
        >
          <ChevronLeft size={20} color="#111" />
          <Text style={{ fontSize: 16, fontWeight: "400", color: "#111" }}>
            Back
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 17, fontWeight: "400", color: "#111" }}>
          Dating Preferences
        </Text>

        <TouchableOpacity
          onPress={done}
          disabled={!loaded}
          style={{ padding: 8, opacity: loaded ? 1 : 0.5 }}
        >
          <Text style={{ fontSize: 16, fontWeight: "400", color: "#FF1744" }}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <FilterSection title="Discovery">
          <NavRow
            title="Interested in"
            value={valueFor("gender")}
            onPress={() => handlePressPreference("gender")}
          />
          <NavRow
            title="Age range"
            value={valueFor("age")}
            onPress={() => handlePressPreference("age")}
          />
          <NavRow
            title="Distance"
            value={valueFor("distance")}
            onPress={() => handlePressPreference("distance")}
          />
          <NavRow
            title="Passport mode"
            value={valueFor("passport")}
            onPress={() => handlePressPreference("passport")}
            isLast
          />
        </FilterSection>

        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "400",
              color: "#8E8E93",
              letterSpacing: 0.4,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Membership
          </Text>

          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#E5E5EA",
            }}
          >
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "400", color: "#111" }}>
                {isPro
                  ? "Membership is active"
                  : "Unlock more dating preferences"}
              </Text>
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
                {isPro
                  ? "Advanced preferences and dealbreakers are unlocked."
                  : "Get advanced preferences and set dealbreakers."}
              </Text>

              {!isPro && (
                <TouchableOpacity
                  onPress={openPremium}
                  activeOpacity={0.8}
                  style={{
                    marginTop: 12,
                    backgroundColor: "#FF1744",
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    opacity: subLoading ? 0.7 : 1,
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: "400", color: "#fff" }}
                  >
                    See plans
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {premiumPreviewGroups.map((group, groupIdx) => {
              const isLastGroup = groupIdx === premiumPreviewGroups.length - 1;

              return (
                <View
                  key={group.title}
                  style={{ borderTopWidth: 1, borderTopColor: "#E5E5EA" }}
                >
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingTop: 12,
                      paddingBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "400",
                        color: "#8E8E93",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                      }}
                    >
                      {group.title}
                    </Text>
                  </View>

                  {group.rows.map((r, idx) => {
                    const isLast = isLastGroup && idx === group.rows.length - 1;

                    // IMPORTANT: rows are always tappable.
                    // If user is not Pro, tapping will prompt the paywall.
                    if (!isPro) {
                      return (
                        <LockedRow
                          key={r.key}
                          title={r.label}
                          onPress={() => handlePressPreference(r.key)}
                          isLast={isLast}
                        />
                      );
                    }

                    return (
                      <NavRow
                        key={r.key}
                        title={r.label}
                        value={valueFor(r.key)}
                        onPress={() => handlePressPreference(r.key)}
                        isLast={isLast}
                      />
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <TouchableOpacity
            onPress={reset}
            activeOpacity={0.7}
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: "#E5E5EA",
            }}
          >
            <RotateCcw size={18} color="#111" />
            <Text style={{ fontSize: 15, fontWeight: "400", color: "#111" }}>
              Reset preferences
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}
