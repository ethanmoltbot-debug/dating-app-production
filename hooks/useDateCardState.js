import { useState, useMemo, useCallback } from "react";
import { pad2, recommendStartTime } from "@/utils/dateCardHelpers";

export function useDateCardState(dateModel, overlapTimes) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState("7:00 PM");
  const [timeOpen, setTimeOpen] = useState(false);
  const [placeLabel, setPlaceLabel] = useState("");
  const [placeId, setPlaceId] = useState(null);
  const [placeSecondary, setPlaceSecondary] = useState("");
  const [placeOpen, setPlaceOpen] = useState(false);
  const [activityLabel, setActivityLabel] = useState("");
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const resetPlanForm = useCallback(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = pad2(now.getMonth() + 1);
    const dd = pad2(now.getDate());
    if (!selectedDate) setSelectedDate(`${yyyy}-${mm}-${dd}`);
    if (!activityLabel) setActivityLabel(dateModel?.activityLabel || "");

    if (!placeLabel) setPlaceLabel(dateModel?.placeLabel || "");
    if (!placeId && dateModel?.placeId) setPlaceId(String(dateModel.placeId));
    setPlaceSecondary("");

    const rec = recommendStartTime(overlapTimes);
    const usingDefaultTime = startTime === "7:00 PM";
    if (rec && usingDefaultTime) {
      setStartTime(rec);
    }
  }, [
    activityLabel,
    dateModel?.activityLabel,
    dateModel?.placeId,
    dateModel?.placeLabel,
    overlapTimes,
    placeId,
    placeLabel,
    selectedDate,
    startTime,
  ]);

  const onPickPlace = useCallback(({ placeId: pid, label, secondary }) => {
    setPlaceId(pid || null);
    setPlaceLabel(label || "");
    setPlaceSecondary(secondary || "");
  }, []);

  const onClearPlace = useCallback(() => {
    setPlaceId(null);
    setPlaceLabel("");
    setPlaceSecondary("");
  }, []);

  const onQuickPlace = useCallback((label) => {
    setPlaceId(null);
    setPlaceSecondary("");
    setPlaceLabel(label);
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    timeOpen,
    setTimeOpen,
    placeLabel,
    setPlaceLabel,
    placeId,
    setPlaceId,
    placeSecondary,
    setPlaceSecondary,
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
  };
}
