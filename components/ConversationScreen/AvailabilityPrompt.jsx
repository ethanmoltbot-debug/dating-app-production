import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMatchAvailability } from "@/hooks/useMatchAvailability";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Daytime", "Evening", "Late", "Flexible"];

function safeDateMs(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

function uniqueStrings(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const s = String(v || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function Chip({ label, active, onPress }) {
  const bg = active ? "#FF1744" : "#FFFFFF";
  const color = active ? "#FFFFFF" : "#2D2D2D";
  const borderColor = active ? "#FF1744" : "#E5E5E5";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor: bg,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AvailabilityPrompt({
  matchId,
  userId,
  triggerSource, // null | 'messages' | 'planDate'
  onSaved,
  onSkipped,
  showSkip = true,
  ignoreDismissCooldown = false,
  showNotSure = false,
  // NEW: allow editing even when availability is already saved
  forceShow = false,
  // NEW: when editing, hydrate initial selections from current availability
  hydrateFromAvailability = false,
}) {
  const queryClient = useQueryClient();
  const availabilityQuery = useMatchAvailability(matchId, userId);

  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [notSure, setNotSure] = useState(false);
  const [hasHydratedFromSeed, setHasHydratedFromSeed] = useState(false);

  const data = availabilityQuery.data;
  const availability = data?.availability || null;
  const seed = data?.seed || null;

  const nowMs = Date.now();

  const dismissedUntilMs = safeDateMs(availability?.dismissedUntil);
  const notSureUntilMs = safeDateMs(availability?.notSureUntil);

  const hasSavedNormalAvailability =
    availability &&
    !availability.tag &&
    Array.isArray(availability.days) &&
    availability.days.length > 0;

  const shouldSuppressForDismiss =
    !ignoreDismissCooldown &&
    typeof dismissedUntilMs === "number" &&
    dismissedUntilMs > nowMs;

  const shouldSuppressForNotSure =
    availability?.tag === "not_sure" &&
    typeof notSureUntilMs === "number" &&
    notSureUntilMs > nowMs &&
    triggerSource !== "planDate";

  const hasTrigger = Boolean(triggerSource);

  const shouldShow =
    hasTrigger &&
    !availabilityQuery.isLoading &&
    !availabilityQuery.isError &&
    (forceShow || !hasSavedNormalAvailability) &&
    !shouldSuppressForDismiss &&
    !shouldSuppressForNotSure;

  useEffect(() => {
    if (!shouldShow) return;

    // If they previously said "not sure", only keep that state when the UI is allowed to show it.
    // IMPORTANT: only do this hydration once (otherwise we'd keep clearing user selections).
    if (availability?.tag === "not_sure" && !hasHydratedFromSeed) {
      setSelectedDays([]);
      setSelectedTimes([]);

      if (showNotSure) {
        setNotSure(true);
        setHasHydratedFromSeed(true);
        return;
      }

      // Date tab / plan-date flows: force them into picking real availability.
      setNotSure(false);
      // do NOT return; allow hydration below
    }

    if (hasHydratedFromSeed) return;

    // NEW: for edit flows, prefer current saved availability as the initial state
    const baseDays = hydrateFromAvailability
      ? uniqueStrings(availability?.days)
      : uniqueStrings(seed?.days);
    const baseTimes = hydrateFromAvailability
      ? uniqueStrings(availability?.times)
      : uniqueStrings(seed?.times);

    if (baseDays.length > 0) {
      setSelectedDays(baseDays.slice(0, 3));
    }

    if (baseTimes.length > 0) {
      setSelectedTimes(baseTimes);
    }

    setHasHydratedFromSeed(true);
  }, [
    availability?.days,
    availability?.tag,
    availability?.times,
    hasHydratedFromSeed,
    hydrateFromAvailability,
    seed?.days,
    seed?.times,
    shouldShow,
    showNotSure,
  ]);

  const saveMutation = useMutation({
    mutationFn: async ({ days, times, tag }) => {
      const resp = await fetch(`/api/matches/${matchId}/availability/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          days,
          times,
          tag,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/matches/${matchId}/availability/save, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matchAvailability", String(matchId), Number(userId)],
      });
      if (onSaved) onSaved();
    },
    onError: (e) => {
      console.error(e);
      Alert.alert("Could not save", "Please try again.");
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch(`/api/matches/${matchId}/availability/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId) }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/matches/${matchId}/availability/skip, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matchAvailability", String(matchId), Number(userId)],
      });
      if (onSkipped) onSkipped();
    },
    onError: (e) => {
      console.error(e);
      Alert.alert("Could not skip", "Please try again.");
    },
  });

  const busy = saveMutation.isPending || skipMutation.isPending;

  const onToggleDay = useCallback(
    (day) => {
      setNotSure(false);
      setSelectedDays((prev) => {
        const has = prev.includes(day);
        if (has) {
          return prev.filter((d) => d !== day);
        }

        if (prev.length >= 3) {
          Alert.alert("Up to 3", "Pick up to 3 days.");
          return prev;
        }

        return [...prev, day];
      });
    },
    [setSelectedDays],
  );

  const onToggleTime = useCallback(
    (time) => {
      setNotSure(false);
      setSelectedTimes((prev) => {
        const has = prev.includes(time);
        if (has) {
          return prev.filter((t) => t !== time);
        }
        return [...prev, time];
      });
    },
    [setSelectedTimes],
  );

  const onPressNotSure = useCallback(() => {
    if (!showNotSure) {
      return;
    }
    setNotSure(true);
    setSelectedDays([]);
    setSelectedTimes([]);
    saveMutation.mutate({ days: [], times: [], tag: "not_sure" });
  }, [saveMutation, showNotSure]);

  const onPressSave = useCallback(() => {
    if (notSure) {
      saveMutation.mutate({ days: [], times: [], tag: "not_sure" });
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert("Pick some days", "Pick up to 3 days you’re usually free.");
      return;
    }

    saveMutation.mutate({
      days: selectedDays,
      times: selectedTimes,
      tag: null,
    });
  }, [notSure, saveMutation, selectedDays, selectedTimes]);

  const onPressSkip = useCallback(() => {
    if (!showSkip) {
      return;
    }
    skipMutation.mutate();
  }, [showSkip, skipMutation]);

  const titleLine = "Wifey can help lock this in faster 🍸";
  const questionLine = "When are you usually free to meet up?";

  const cardOpacity = busy ? 0.7 : 1;
  const showSpinner = availabilityQuery.isLoading;

  const card = useMemo(() => {
    if (!shouldShow) return null;

    if (showSpinner) {
      return (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E5E5",
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="small" color="#FF1744" />
        </View>
      );
    }

    const daysChips = (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 10,
        }}
      >
        {DAYS.map((d) => {
          const active = selectedDays.includes(d);
          return (
            <Chip
              key={d}
              label={d}
              active={active}
              onPress={() => onToggleDay(d)}
            />
          );
        })}
      </View>
    );

    const timeChips = (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 10,
        }}
      >
        {TIMES.map((t) => {
          const active = selectedTimes.includes(t);
          return (
            <Chip
              key={t}
              label={t}
              active={active}
              onPress={() => onToggleTime(t)}
            />
          );
        })}
      </View>
    );

    const saveDisabled = busy;

    const actionsRow = showSkip ? (
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <TouchableOpacity
          onPress={onPressSkip}
          disabled={busy}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressSave}
          disabled={saveDisabled}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "#FF1744",
            alignItems: "center",
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#fff" }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>
    ) : (
      <View style={{ marginTop: 14 }}>
        <TouchableOpacity
          onPress={onPressSave}
          disabled={saveDisabled}
          style={{
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "#FF1744",
            alignItems: "center",
            opacity: saveDisabled ? 0.7 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#fff" }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );

    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E5E5",
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 14,
          opacity: cardOpacity,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "900",
            color: "#111",
          }}
        >
          {titleLine}
        </Text>

        <Text
          style={{
            fontSize: 13,
            color: "#444",
            marginTop: 6,
            fontWeight: "700",
          }}
        >
          {questionLine}
        </Text>

        <Text style={{ fontSize: 12, color: "#777", marginTop: 8 }}>
          Pick up to 3 days
        </Text>

        {daysChips}

        <Text style={{ fontSize: 12, color: "#777", marginTop: 12 }}>
          Time (optional)
        </Text>

        {timeChips}

        {actionsRow}

        {showNotSure ? (
          <TouchableOpacity
            onPress={onPressNotSure}
            disabled={busy}
            style={{ alignSelf: "center", marginTop: 12, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "800" }}>
              Not sure yet
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }, [
    busy,
    cardOpacity,
    onPressNotSure,
    onPressSave,
    onPressSkip,
    onToggleDay,
    onToggleTime,
    questionLine,
    selectedDays,
    selectedTimes,
    shouldShow,
    showSpinner,
    showSkip,
    showNotSure,
    titleLine,
  ]);

  return card;
}
