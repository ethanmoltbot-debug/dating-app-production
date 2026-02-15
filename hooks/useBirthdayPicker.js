import { useState, useCallback } from "react";
import { daysInMonth } from "@/utils/birthdateHelpers";

export function useBirthdayPicker(
  birthYear,
  birthMonth,
  birthDay,
  setBirthYear,
  setBirthMonth,
  setBirthDay,
  setBirthdateRaw,
  isBusy,
) {
  const [birthPickerOpen, setBirthPickerOpen] = useState(false);
  const [draftBirthYear, setDraftBirthYear] = useState(birthYear);
  const [draftBirthMonth, setDraftBirthMonth] = useState(birthMonth);
  const [draftBirthDay, setDraftBirthDay] = useState(birthDay);

  const openBirthPicker = useCallback(() => {
    if (isBusy) return;
    setDraftBirthYear(birthYear);
    setDraftBirthMonth(birthMonth);
    setDraftBirthDay(birthDay);
    setBirthPickerOpen(true);
  }, [birthDay, birthMonth, birthYear, isBusy]);

  const cancelBirthPicker = useCallback(() => {
    setBirthPickerOpen(false);
  }, []);

  const confirmBirthPicker = useCallback(() => {
    const maxD = daysInMonth(draftBirthYear, draftBirthMonth);
    const safeDay = Math.min(draftBirthDay, maxD);
    setBirthYear(draftBirthYear);
    setBirthMonth(draftBirthMonth);
    setBirthDay(safeDay);
    setBirthdateRaw(
      `${String(draftBirthYear).padStart(4, "0")}-${String(draftBirthMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`,
    );
    setBirthPickerOpen(false);
  }, [
    draftBirthDay,
    draftBirthMonth,
    draftBirthYear,
    setBirthDay,
    setBirthMonth,
    setBirthYear,
    setBirthdateRaw,
  ]);

  return {
    birthPickerOpen,
    draftBirthYear,
    setDraftBirthYear,
    draftBirthMonth,
    setDraftBirthMonth,
    draftBirthDay,
    setDraftBirthDay,
    openBirthPicker,
    cancelBirthPicker,
    confirmBirthPicker,
  };
}
