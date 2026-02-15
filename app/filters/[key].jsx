import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronLeft, Lock, LocateFixed } from "lucide-react-native";
import {
  DATING_PREFS_STORAGE_KEY,
  PREF_DEFS,
  DEFAULT_DATING_PREFERENCES,
  normalizePrefsFromStorage,
} from "../../utils/datingPreferences";
import {
  SingleSlider,
  RangeSlider,
} from "@/components/PreferenceSliders/Sliders";
import LocationAutocompleteInput from "@/components/LocationAutocompleteInput";
import { useSubscription } from "@/utils/subscription";
import { formatHeight } from "@/utils/onboardingProfileHelpers";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function OptionRow({ label, selected, onPress, isLast }) {
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
        {label}
      </Text>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "500",
          color: selected ? "#FF1744" : "transparent",
        }}
      >
        ✓
      </Text>
    </TouchableOpacity>
  );
}

export default function DatingPreferenceDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { key: keyParam } = useLocalSearchParams();
  const { isPro, loading: subLoading } = useSubscription();

  const key = Array.isArray(keyParam) ? keyParam[0] : keyParam;
  const def = key ? PREF_DEFS[key] : null;

  const premiumKeys = useMemo(
    () =>
      new Set([
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
      ]),
    [],
  );

  const isLocked = useMemo(() => {
    if (!key) return false;
    if (!premiumKeys.has(key)) return false;
    if (subLoading) return true;
    return !isPro;
  }, [isPro, key, premiumKeys, subLoading]);

  const [prefs, setPrefs] = useState(DEFAULT_DATING_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  // NEW: passport mode state (local input + resolving/error)
  const [passportText, setPassportText] = useState("");
  const [passportSaving, setPassportSaving] = useState(false);
  const [passportError, setPassportError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(DATING_PREFS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const normalized = normalizePrefsFromStorage(parsed);
        setPrefs(normalized);

        // sync input text for passport mode
        const label = String(normalized?.passport?.label || "");
        setPassportText(label);
      } catch (e) {
        console.error(e);
        setPrefs(DEFAULT_DATING_PREFERENCES);
        setPassportText("");
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, []);

  const title = useMemo(() => {
    if (!key || !def) {
      return "Preference";
    }
    return def.title;
  }, [key, def]);

  const unlock = useCallback(() => {
    if (!key) {
      return;
    }

    // Always route to our custom subscription page (week / month / 6 months)
    // and bounce back to this preference after purchase.
    const returnTo = encodeURIComponent(`/filters/${key}`);
    router.push(`/subscription?returnTo=${returnTo}`);
  }, [key, router]);

  const dealbreakerValue = useMemo(() => {
    if (!key) return false;
    return !!prefs.dealbreakers?.[key];
  }, [prefs, key]);

  const setDealbreaker = useCallback(
    (value) => {
      if (!key) return;
      setPrefs((prev) => ({
        ...prev,
        dealbreakers: { ...(prev.dealbreakers || {}), [key]: !!value },
      }));
    },
    [key],
  );

  const saveAndBack = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        DATING_PREFS_STORAGE_KEY,
        JSON.stringify(prefs),
      );

      // Keep legacy key in sync for older parts of the app.
      await AsyncStorage.setItem(
        "profileFilters",
        JSON.stringify({
          minAge: prefs.minAge,
          maxAge: prefs.maxAge,
          maxDistance: prefs.maxDistance,
          gender: prefs.gender,
        }),
      );
    } catch (e) {
      console.error(e);
    } finally {
      router.back();
    }
  }, [prefs, router]);

  const resolvePlaceDetails = useCallback(
    async ({ placeId, fallbackLabel }) => {
      if (!placeId) {
        return null;
      }

      setPassportSaving(true);
      setPassportError(null);

      try {
        const url = `/api/places/details?placeId=${encodeURIComponent(placeId)}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          let message = `Place details failed ([${resp.status}] ${resp.statusText})`;
          try {
            const errJson = await resp.json();
            const extra = errJson?.message || errJson?.error;
            if (extra) {
              message = `${message}: ${extra}`;
            }
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        const json = await resp.json();
        const lat = Number(json?.lat);
        const lng = Number(json?.lng);
        const label = String(json?.label || fallbackLabel || "").trim();

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          throw new Error("Could not read location coordinates");
        }

        const nextPassport = {
          enabled: true,
          label,
          placeId: String(placeId),
          lat,
          lng,
        };

        setPrefs((prev) => ({ ...prev, passport: nextPassport }));
        setPassportText(label);
        return nextPassport;
      } catch (e) {
        console.error(e);
        setPassportError(
          String(e?.message || "Could not set passport location"),
        );
        return null;
      } finally {
        setPassportSaving(false);
      }
    },
    [],
  );

  const togglePassport = useCallback(
    (value) => {
      const on = !!value;
      setPassportError(null);

      setPrefs((prev) => {
        const current = prev?.passport || {};

        if (!on) {
          return {
            ...prev,
            passport: {
              enabled: false,
              label: "",
              placeId: null,
              lat: null,
              lng: null,
            },
          };
        }

        return {
          ...prev,
          passport: {
            enabled: true,
            label: String(current?.label || passportText || "").trim(),
            placeId: current?.placeId || null,
            lat: Number.isFinite(Number(current?.lat))
              ? Number(current.lat)
              : null,
            lng: Number.isFinite(Number(current?.lng))
              ? Number(current.lng)
              : null,
          },
        };
      });

      if (!on) {
        setPassportText("");
      }
    },
    [passportText],
  );

  const useMyCurrentLocationQuick = useCallback(() => {
    // This is meant as a fast "go back to normal" button.
    // (Turning passport off makes the feed use the user's real coordinates.)
    setPassportError(null);
    setPassportSaving(false);
    setPassportText("");
    setPrefs((prev) => ({
      ...prev,
      passport: {
        enabled: false,
        label: "",
        placeId: null,
        lat: null,
        lng: null,
      },
    }));
  }, []);

  const renderBody = () => {
    if (!key || !def) {
      return (
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, color: "#111", fontWeight: "400" }}>
            Unknown preference.
          </Text>
        </View>
      );
    }

    if (isLocked) {
      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E5EA",
              padding: 16,
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Lock size={18} color="#111" />
              <Text style={{ fontSize: 16, fontWeight: "400", color: "#111" }}>
                Membership preference
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: "#6B7280" }}>
              Upgrade to unlock this preference and set it as a dealbreaker.
            </Text>
            <TouchableOpacity
              onPress={unlock}
              activeOpacity={0.8}
              style={{
                marginTop: 6,
                backgroundColor: "#FF1744",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                alignSelf: "stretch",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "400", color: "#fff" }}>
                See plans
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // NEW: passport mode editor
    if (def.type === "passport") {
      const enabled = !!prefs?.passport?.enabled;
      const hasCoords =
        Number.isFinite(Number(prefs?.passport?.lat)) &&
        Number.isFinite(Number(prefs?.passport?.lng));

      const helperText = enabled
        ? hasCoords
          ? "Your feed distance will be based on this location."
          : "Pick a city so we can base your feed radius around it."
        : "Turn this on to browse profiles around another city.";

      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E5EA",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "400", color: "#111" }}
                >
                  Passport mode
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                  {helperText}
                </Text>
              </View>
              <Switch value={enabled} onValueChange={togglePassport} />
            </View>

            {enabled ? (
              <View style={{ marginTop: 14 }}>
                <LocationAutocompleteInput
                  value={passportText}
                  onChangeText={(t) => {
                    setPassportText(t);
                    // keep label in sync while typing (coords will only be set on select)
                    setPrefs((prev) => ({
                      ...prev,
                      passport: {
                        ...(prev.passport || {}),
                        enabled: true,
                        label: String(t || ""),
                      },
                    }));
                  }}
                  types="(cities)"
                  placeholder="Search a city"
                  accent="#FF1744"
                  maxHeight={220}
                  onSelectSuggestion={async (s) => {
                    await resolvePlaceDetails({
                      placeId: s?.placeId,
                      fallbackLabel: s?.label,
                    });
                  }}
                />

                <TouchableOpacity
                  onPress={useMyCurrentLocationQuick}
                  activeOpacity={0.85}
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderRadius: 12,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: "rgba(17,17,17,0.10)",
                    backgroundColor: "rgba(17,17,17,0.04)",
                  }}
                >
                  <LocateFixed size={16} color="#111" />
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: "#111" }}
                  >
                    Use my current location
                  </Text>
                </TouchableOpacity>

                {passportSaving ? (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                      marginTop: 10,
                    }}
                  >
                    <ActivityIndicator size="small" color="#FF1744" />
                    <Text style={{ fontSize: 13, color: "#6B7280" }}>
                      Saving location…
                    </Text>
                  </View>
                ) : null}

                {passportError ? (
                  <Text
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: "#B00020",
                    }}
                  >
                    {passportError}
                  </Text>
                ) : null}

                {!passportSaving && enabled && !hasCoords ? (
                  <Text
                    style={{ marginTop: 10, fontSize: 12, color: "#6B7280" }}
                  >
                    Tip: tap one of the dropdown options to set the location.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      );
    }

    if (def.type === "ageRange") {
      const minAge = prefs.minAge;
      const maxAge = prefs.maxAge;

      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E5EA",
              overflow: "hidden",
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "400", color: "#111" }}>
              Age range
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
              {minAge}–{maxAge}
            </Text>

            <RangeSlider
              min={18}
              max={99}
              step={1}
              minValue={minAge}
              maxValue={maxAge}
              onChange={({ minValue: nextMin, maxValue: nextMax }) => {
                const nextMinClamped = clamp(nextMin, 18, 98);
                const nextMaxClamped = clamp(nextMax, nextMinClamped + 1, 99);
                setPrefs((prev) => ({
                  ...prev,
                  minAge: nextMinClamped,
                  maxAge: nextMaxClamped,
                }));
              }}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 12, color: "#8E8E93" }}>18</Text>
              <Text style={{ fontSize: 12, color: "#8E8E93" }}>99</Text>
            </View>
          </View>
        </View>
      );
    }

    if (def.type === "heightRange") {
      const minH = Number(prefs?.minHeightInches);
      const maxH = Number(prefs?.maxHeightInches);

      const safeMin = Number.isFinite(minH) ? minH : 36;
      const safeMax = Number.isFinite(maxH) ? maxH : 84;

      const label = `${formatHeight(safeMin)}–${formatHeight(safeMax)}`;

      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E5EA",
              overflow: "hidden",
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "400", color: "#111" }}>
              Height range
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
              {label}
            </Text>

            <RangeSlider
              min={36}
              max={84}
              step={1}
              minValue={safeMin}
              maxValue={safeMax}
              onChange={({ minValue: nextMin, maxValue: nextMax }) => {
                const nextMinClamped = clamp(nextMin, 36, 83);
                const nextMaxClamped = clamp(nextMax, nextMinClamped + 1, 84);

                setPrefs((prev) => ({
                  ...prev,
                  minHeightInches: nextMinClamped,
                  maxHeightInches: nextMaxClamped,
                }));
              }}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 12, color: "#8E8E93" }}>
                {formatHeight(36)}
              </Text>
              <Text style={{ fontSize: 12, color: "#8E8E93" }}>
                {formatHeight(84)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (def.type === "number") {
      const min = def.min ?? 1;
      const max = def.max ?? 500;
      const step = def.step ?? 1;
      const unit = def.unitLabel || "";

      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E5EA",
              overflow: "hidden",
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "400", color: "#111" }}>
              Maximum distance
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
              {prefs.maxDistance} {unit}
            </Text>

            <SingleSlider
              min={min}
              max={max}
              step={step}
              value={prefs.maxDistance}
              onChange={(v) =>
                setPrefs((prev) => ({ ...prev, maxDistance: v }))
              }
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 12, color: "#8E8E93" }}>{min}</Text>
              <Text style={{ fontSize: 12, color: "#8E8E93" }}>{max}</Text>
            </View>
          </View>
        </View>
      );
    }

    if (def.type === "multi") {
      const options = def.options || [];
      const currentArr = Array.isArray(prefs[key]) ? prefs[key] : [];

      const toggle = (val) => {
        setPrefs((prev) => {
          const arr = Array.isArray(prev[key]) ? prev[key] : [];
          const has = arr.includes(val);
          const next = has ? arr.filter((x) => x !== val) : [...arr, val];
          return { ...prev, [key]: next };
        });
      };

      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#E5E5EA",
            }}
          >
            <OptionRow
              label="Any"
              selected={currentArr.length === 0}
              onPress={() => setPrefs((prev) => ({ ...prev, [key]: [] }))}
            />
            {options.map((opt, idx) => {
              const isLast = idx === options.length - 1;
              const selected = currentArr.includes(opt.value);
              return (
                <OptionRow
                  key={String(opt.value)}
                  label={opt.label}
                  selected={selected}
                  isLast={isLast}
                  onPress={() => toggle(opt.value)}
                />
              );
            })}
          </View>
        </View>
      );
    }

    // single
    const options = def.options || [];
    const current = prefs[key];

    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E5E5EA",
          }}
        >
          {options.map((opt, idx) => {
            const isLast = idx === options.length - 1;
            const selected = opt.value === current;
            return (
              <OptionRow
                key={String(opt.value)}
                label={opt.label}
                selected={selected}
                isLast={isLast}
                onPress={() =>
                  setPrefs((prev) => ({ ...prev, [key]: opt.value }))
                }
              />
            );
          })}
        </View>
      </View>
    );
  };

  const canRenderDealbreaker =
    !!key && loaded && !isLocked && key !== "passport";

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
          {title}
        </Text>

        <TouchableOpacity
          onPress={saveAndBack}
          disabled={!loaded || isLocked}
          style={{
            padding: 8,
            opacity: loaded && !isLocked ? 1 : 0.5,
          }}
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
        {canRenderDealbreaker && (
          <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E5E5EA",
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "400", color: "#111" }}
                >
                  Dealbreaker
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                  Only show people who match this preference
                </Text>
              </View>
              <Switch value={dealbreakerValue} onValueChange={setDealbreaker} />
            </View>
          </View>
        )}

        {renderBody()}

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}
