import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  INTEREST_CATEGORIES,
  INTEREST_MAX_SELECTED,
  getAllInterestOptions,
} from "@/utils/interestsCatalog";

const STORAGE_INITIAL_KEY = "interest_picker_initial";
const STORAGE_RESULT_KEY = "interest_picker_result";

const ACCENT = "#7C3AED";

function normalizeLabel(label) {
  return String(label || "").trim();
}

function uniqStrings(list) {
  const out = [];
  const seen = new Set();
  for (const v of list || []) {
    const s = normalizeLabel(v);
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

export default function InterestsPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_INITIAL_KEY);
        if (!mounted) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setSelected(uniqStrings(parsed).slice(0, INTEREST_MAX_SELECTED));
            }
          } catch {
            // ignore
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setHydrating(false);
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCount = selected.length;
  const countLabel = `${selectedCount}/${INTEREST_MAX_SELECTED} selected`;

  const allOptions = useMemo(() => getAllInterestOptions(), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allOptions
      .filter((x) => String(x).toLowerCase().includes(q))
      .slice(0, 50);
  }, [allOptions, query]);

  const toggle = useCallback((label) => {
    const item = normalizeLabel(label);
    if (!item) return;

    setSelected((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.some(
        (x) => String(x).toLowerCase() === item.toLowerCase(),
      );

      if (exists) {
        return safePrev.filter(
          (x) => String(x).toLowerCase() !== item.toLowerCase(),
        );
      }
      if (safePrev.length >= INTEREST_MAX_SELECTED) {
        return safePrev;
      }
      return [...safePrev, item];
    });
  }, []);

  const remove = useCallback((label) => {
    const item = normalizeLabel(label);
    if (!item) return;
    setSelected((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (x) => String(x).toLowerCase() !== item.toLowerCase(),
      ),
    );
  }, []);

  const onDone = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_RESULT_KEY,
        JSON.stringify({
          interests: selected,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch (e) {
      console.error(e);
    }
    router.back();
  }, [router, selected]);

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  const chipStyle = useCallback((isSelected) => {
    const borderColor = isSelected
      ? "rgba(124,58,237,0.45)"
      : "rgba(17,17,17,0.10)";
    const backgroundColor = isSelected
      ? "rgba(124,58,237,0.12)"
      : "rgba(255,255,255,0.82)";
    return {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor,
      backgroundColor,
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: "rgba(17,17,17,0.08)",
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{ paddingVertical: 8, paddingRight: 12 }}
        >
          <Text style={{ color: "#111", fontWeight: "800", fontSize: 16 }}>
            ✕
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#111", fontWeight: "900", fontSize: 16 }}>
            Interests
          </Text>
          <Text style={{ color: "#6B7280", fontWeight: "700", fontSize: 12 }}>
            {countLabel}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onDone}
          style={{ paddingVertical: 8, paddingLeft: 12 }}
        >
          <Text style={{ color: ACCENT, fontWeight: "900", fontSize: 16 }}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected */}
        <View style={{ paddingTop: 14 }}>
          <Text style={{ color: "#6B7280", fontWeight: "800", fontSize: 12 }}>
            Selected
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 10,
            }}
          >
            {selectedCount === 0 ? (
              <Text style={{ color: "#9CA3AF", fontWeight: "700" }}>
                Pick a few so we can show you better matches.
              </Text>
            ) : null}

            {selected.map((label) => (
              <TouchableOpacity
                key={`selected-${label}`}
                onPress={() => remove(label)}
                activeOpacity={0.85}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: "rgba(17,17,17,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.08)",
                }}
              >
                <Text style={{ color: "#111", fontWeight: "800" }}>
                  {label} ✕
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search */}
        <View style={{ marginTop: 16 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search interests"
            placeholderTextColor="#9CA3AF"
            style={{
              backgroundColor: "rgba(17,17,17,0.04)",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === "ios" ? 12 : 10,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.08)",
              fontSize: 15,
              color: "#111",
              fontWeight: "700",
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType={Platform.OS === "ios" ? "search" : "done"}
          />
        </View>

        {/* Search results */}
        {query.trim() ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: "#111", fontWeight: "900", fontSize: 14 }}>
              Results
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 10,
              }}
            >
              {results.length === 0 ? (
                <Text style={{ color: "#6B7280", fontWeight: "700" }}>
                  No matches.
                </Text>
              ) : null}
              {results.map((label) => {
                const isSelected = selected.some(
                  (x) =>
                    String(x).toLowerCase() === String(label).toLowerCase(),
                );
                return (
                  <TouchableOpacity
                    key={`result-${label}`}
                    onPress={() => toggle(label)}
                    activeOpacity={0.85}
                    style={chipStyle(isSelected)}
                  >
                    <Text
                      style={{
                        color: "#111",
                        fontWeight: isSelected ? "900" : "800",
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Categories */}
        {!query.trim() ? (
          <View style={{ marginTop: 18, gap: 18 }}>
            {INTEREST_CATEGORIES.map((cat) => {
              const emoji = String(cat.emoji || "").trim();
              const titleText = emoji ? `${emoji} ${cat.title}` : cat.title;

              return (
                <View key={cat.key}>
                  <Text
                    style={{ color: "#111", fontWeight: "900", fontSize: 14 }}
                  >
                    {titleText}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    {cat.options.map((label) => {
                      const isSelected = selected.some(
                        (x) =>
                          String(x).toLowerCase() ===
                          String(label).toLowerCase(),
                      );
                      return (
                        <TouchableOpacity
                          key={`${cat.key}-${label}`}
                          onPress={() => toggle(label)}
                          activeOpacity={0.85}
                          style={chipStyle(isSelected)}
                        >
                          <Text
                            style={{
                              color: "#111",
                              fontWeight: isSelected ? "900" : "800",
                            }}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Spacer */}
        <View style={{ height: hydrating ? 20 : 0 }} />
      </ScrollView>
    </View>
  );
}
