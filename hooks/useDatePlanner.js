import { useState, useEffect, useMemo, useCallback } from "react";
import { Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMinutesToIso,
  buildDateTimeIso,
  formatTimeLabelFromIso,
  pad2,
} from "@/utils/datePlannerHelpers";

const DEFAULT_DATE_DURATION_MINUTES = 120;

export function useDatePlanner({ matchId, userId }) {
  const queryClient = useQueryClient();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState("7:00 PM");
  // NOTE: no end-time input in UI; we compute dateEnd automatically
  const [activityLabel, setActivityLabel] = useState("");
  const [placeLabel, setPlaceLabel] = useState("");
  const [placeId, setPlaceId] = useState(null);
  const [placeSecondary, setPlaceSecondary] = useState("");

  const [hydrated, setHydrated] = useState(false);

  const canQuery = Boolean(matchId) && Number.isFinite(Number(userId));

  const dateQuery = useQuery({
    queryKey: ["matchDate", String(matchId), Number(userId)],
    enabled: canQuery,
    queryFn: async () => {
      const resp = await fetch(
        `/api/matches/${matchId}/date?userId=${Number(userId)}`,
      );
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/matches/${matchId}/date, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      return resp.json();
    },
  });

  const dateModel = dateQuery.data?.date || null;

  useEffect(() => {
    if (!dateModel || hydrated) {
      return;
    }

    const nextDate = (() => {
      const start = dateModel?.dateStart ? new Date(dateModel.dateStart) : null;
      if (start && !Number.isNaN(start.getTime())) {
        return `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`;
      }
      const now = new Date();
      return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    })();

    setSelectedDate(nextDate);

    const nextStart = formatTimeLabelFromIso(dateModel?.dateStart);
    if (nextStart) setStartTime(nextStart);

    if (dateModel?.activityLabel) {
      setActivityLabel(String(dateModel.activityLabel));
    }

    if (dateModel?.placeLabel) {
      setPlaceLabel(String(dateModel.placeLabel));
    }

    if (dateModel?.placeId) {
      setPlaceId(String(dateModel.placeId));
    }

    // Secondary text is only used in the picker; it may not be stored.
    setPlaceSecondary("");

    setHydrated(true);
  }, [dateModel, hydrated]);

  const proposeMutation = useMutation({
    mutationFn: async ({
      dateStart,
      dateEnd,
      activityLabel,
      placeLabel,
      placeId,
    }) => {
      const resp = await fetch(`/api/matches/${matchId}/date/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          dateStart,
          dateEnd,
          activityLabel,
          placeLabel,
          placeId,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/matches/${matchId}/date/propose, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matchDate", String(matchId), Number(userId)],
      });
      // Keep drink perk UI in sync (LOCKED -> ARMED)
      queryClient.invalidateQueries({
        queryKey: ["drinkPerk", String(matchId), Number(userId)],
      });
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ response }) => {
      const resp = await fetch(`/api/matches/${matchId}/date/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), response }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/matches/${matchId}/date/respond, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matchDate", String(matchId), Number(userId)],
      });
      // date status changes can affect drink perk state
      queryClient.invalidateQueries({
        queryKey: ["drinkPerk", String(matchId), Number(userId)],
      });
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch(`/api/matches/${matchId}/date/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId) }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/matches/${matchId}/date/cancel, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matchDate", String(matchId), Number(userId)],
      });
      // date cancel should reset drink perk back to normal
      queryClient.invalidateQueries({
        queryKey: ["drinkPerk", String(matchId), Number(userId)],
      });
      setActionsOpen(false);
      setShowEditForm(false);
    },
    onError: (e) => {
      console.error(e);
      Alert.alert("Could not cancel", "Please try again.");
    },
  });

  const proposeDisabled = useMemo(() => {
    const placeOk = String(placeLabel || "").trim().length > 0;
    const activityOk = String(activityLabel || "").trim().length > 0;
    const s = buildDateTimeIso(selectedDate, startTime);
    const e = addMinutesToIso(s, DEFAULT_DATE_DURATION_MINUTES);
    if (!selectedDate) return true;
    if (!s || !e) return true;
    if (!activityOk) return true;
    if (!placeOk) return true;
    return false;
  }, [activityLabel, placeLabel, selectedDate, startTime]);

  const onPropose = useCallback(() => {
    const place = String(placeLabel || "").trim();
    const activity = String(activityLabel || "").trim();
    const startIso = buildDateTimeIso(selectedDate, startTime);
    const endIso = addMinutesToIso(startIso, DEFAULT_DATE_DURATION_MINUTES);

    if (!selectedDate || !startIso || !endIso || !place || !activity) {
      return;
    }

    proposeMutation.mutate({
      dateStart: startIso,
      dateEnd: endIso,
      activityLabel: activity,
      placeLabel: place,
      placeId: placeId ? String(placeId) : null,
    });
  }, [
    activityLabel,
    placeId,
    placeLabel,
    proposeMutation,
    selectedDate,
    startTime,
  ]);

  const confirmCancel = useCallback(() => {
    Alert.alert(
      "Cancel this date?",
      "This will remove the plan for both of you.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel date",
          style: "destructive",
          onPress: () => cancelMutation.mutate(),
        },
      ],
    );
  }, [cancelMutation]);

  const busy =
    dateQuery.isLoading ||
    proposeMutation.isPending ||
    respondMutation.isPending ||
    cancelMutation.isPending;

  return {
    dateQuery,
    dateModel,
    calendarOpen,
    setCalendarOpen,
    actionsOpen,
    setActionsOpen,
    showEditForm,
    setShowEditForm,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    activityLabel,
    setActivityLabel,
    placeLabel,
    setPlaceLabel,
    placeId,
    setPlaceId,
    placeSecondary,
    setPlaceSecondary,
    onPropose,
    confirmCancel,
    proposeMutation,
    respondMutation,
    cancelMutation,
    proposeDisabled,
    busy,
    canQuery,
  };
}
