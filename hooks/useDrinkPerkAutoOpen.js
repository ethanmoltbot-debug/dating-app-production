import { useEffect } from "react";

export function useDrinkPerkAutoOpen({
  matchId,
  openDrinkIntent,
  perkState,
  autoOpenedDrinkRef,
  setUnlockOpen,
}) {
  useEffect(() => {
    if (!matchId) return;
    autoOpenedDrinkRef.current = false;
  }, [matchId, autoOpenedDrinkRef]);

  useEffect(() => {
    if (!openDrinkIntent) return;
    if (autoOpenedDrinkRef.current) return;

    const state = String(perkState || "LOCKED").toUpperCase();
    if (state !== "READY") {
      return;
    }

    autoOpenedDrinkRef.current = true;
    setUnlockOpen(true);
  }, [openDrinkIntent, perkState, autoOpenedDrinkRef, setUnlockOpen]);
}
