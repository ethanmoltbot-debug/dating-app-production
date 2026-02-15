import { useCallback, useMemo, useRef, useState } from "react";
import { View, Alert } from "react-native";
import * as Location from "expo-location";
import { useMatchAvailability } from "@/hooks/useMatchAvailability";
import TimePickerModal from "@/components/TimePickerModal";
import PlaceSearchModal from "@/components/PlaceSearchModal";
import { useDateCardQuery } from "@/hooks/useDateCardQuery";
import { useDateCardState } from "@/hooks/useDateCardState";
import { useDateCardComputed } from "@/hooks/useDateCardComputed";
import { useDateCardMutations } from "@/hooks/useDateCardMutations";
import { DateCardHeader } from "./DateCard/DateCardHeader";
import { DateCardBottomSheet } from "./DateCard/DateCardBottomSheet";
import {
  buildDateTimeIso,
  addMinutesToIso,
  DEFAULT_DATE_DURATION_MINUTES,
} from "@/utils/dateCardHelpers";

export default function DateCard({
  matchId,
  userId,
  onPlanDateTap,
  onAfterDateMutation,
}) {
  const sheetRef = useRef(null);
  const [sheetMode, setSheetMode] = useState("plan");

  const canQuery = Boolean(matchId) && Number.isFinite(Number(userId));

  const dateQuery = useDateCardQuery(matchId, userId);
  const availabilityQuery = useMatchAvailability(matchId, userId);

  const overlapSummary = availabilityQuery.data?.overlap?.summary || null;
  const overlapTimes = availabilityQuery.data?.overlap?.times || null;
  const myAvailability = availabilityQuery.data?.availability || null;
  const otherAvailability = availabilityQuery.data?.otherAvailability || null;

  const dateModel = dateQuery.data?.date || null;
  const coverThumb = String(dateModel?.coverImageUrl || "").trim();

  const state = useDateCardState(dateModel, overlapTimes);
  const {
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    timeOpen,
    setTimeOpen,
    placeLabel,
    placeId,
    placeSecondary,
    placeOpen,
    setPlaceOpen,
    activityLabel,
    setActivityLabel,
    hasLocationPermission,
    setHasLocationPermission,
    resetPlanForm,
    onPickPlace,
    onClearPlace,
    onQuickPlace,
  } = state;

  const computed = useDateCardComputed(
    dateModel,
    hasLocationPermission,
    userId,
  );

  const { proposeMutation, respondMutation } = useDateCardMutations(
    matchId,
    userId,
    sheetRef,
    {
      onAfterMutation: onAfterDateMutation,
    },
  );

  const myHasSavedNormalAvailability = useMemo(() => {
    if (!myAvailability) return false;
    if (myAvailability.tag) return false;
    const days = Array.isArray(myAvailability.days) ? myAvailability.days : [];
    return days.length > 0;
  }, [myAvailability]);

  const otherHasSavedNormalAvailability = useMemo(() => {
    if (!otherAvailability) return false;
    if (otherAvailability.tag) return false;
    const days = Array.isArray(otherAvailability.days)
      ? otherAvailability.days
      : [];
    return days.length > 0;
  }, [otherAvailability]);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === "granted");
      return status === "granted";
    } catch (e) {
      console.error(e);
      setHasLocationPermission(false);
      return false;
    }
  }, [setHasLocationPermission]);

  const openSheet = useCallback(
    async (mode) => {
      setSheetMode(mode);

      if (mode === "plan") {
        resetPlanForm();
      }

      if (mode === "details" && computed.inWindow && !hasLocationPermission) {
        await requestLocationPermission();
      }

      sheetRef.current?.snapToIndex(0);
    },
    [
      computed.inWindow,
      hasLocationPermission,
      requestLocationPermission,
      resetPlanForm,
    ],
  );

  const onSubmitPropose = useCallback(() => {
    const place = String(placeLabel || "").trim();
    const activity = String(activityLabel || "").trim();
    const startIso = buildDateTimeIso(selectedDate, startTime);
    const endIso = addMinutesToIso(startIso, DEFAULT_DATE_DURATION_MINUTES);

    if (!selectedDate) {
      Alert.alert("Pick a date", "Please choose a date.");
      return;
    }

    if (!startIso || !endIso) {
      Alert.alert("Pick a start time", "Choose a time.");
      return;
    }

    if (!place) {
      Alert.alert("Pick a place", "Search for a public place.");
      return;
    }

    if (!activity) {
      Alert.alert("Add an activity", "Dinner, drinks, coffee, etc.");
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

  const suggestions = useMemo(
    () => [
      "Downtown",
      "South Congress",
      "East Austin",
      "Central Austin",
      "Domain",
    ],
    [],
  );

  const onPrimaryPress = useCallback(() => {
    const { effectiveStatus } = computed;

    if (effectiveStatus === "none" || effectiveStatus === "expired") {
      openSheet("plan");
    } else if (effectiveStatus === "proposed") {
      openSheet("review");
    } else if (effectiveStatus === "unlocked") {
      openSheet("credit");
    } else {
      openSheet("details");
    }
  }, [computed, openSheet]);

  const showLoading = dateQuery.isLoading;
  const showError = Boolean(dateQuery.error);

  if (!canQuery) {
    return null;
  }

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12 }}>
      <DateCardHeader
        coverThumb={coverThumb}
        title={computed.title}
        showWaitingPill={computed.showWaitingPill}
        showLoading={showLoading}
        showError={showError}
        buttonLabel={computed.buttonLabel}
        onPress={onPrimaryPress}
      />

      <DateCardBottomSheet
        sheetRef={sheetRef}
        sheetMode={sheetMode}
        dateModel={dateModel}
        matchId={matchId}
        userId={userId}
        overlapSummary={overlapSummary}
        myHasSavedNormalAvailability={myHasSavedNormalAvailability}
        otherHasSavedNormalAvailability={otherHasSavedNormalAvailability}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        startTime={startTime}
        setTimeOpen={setTimeOpen}
        activityLabel={activityLabel}
        setActivityLabel={setActivityLabel}
        placeLabel={placeLabel}
        placeSecondary={placeSecondary}
        setPlaceOpen={setPlaceOpen}
        onClearPlace={onClearPlace}
        suggestions={suggestions}
        onQuickPlace={onQuickPlace}
        onSubmitPropose={onSubmitPropose}
        proposeMutation={proposeMutation}
        respondMutation={respondMutation}
        computed={computed}
        hasLocationPermission={hasLocationPermission}
        requestLocationPermission={requestLocationPermission}
      />

      <TimePickerModal
        visible={timeOpen}
        selectedTime={startTime}
        overlapTimes={overlapTimes}
        onClose={() => setTimeOpen(false)}
        onSelectTime={(t) => setStartTime(t)}
      />

      <PlaceSearchModal
        visible={placeOpen}
        initialQuery={placeLabel}
        onClose={() => setPlaceOpen(false)}
        onSelectPlace={onPickPlace}
      />
    </View>
  );
}
