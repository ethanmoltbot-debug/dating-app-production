import { useMemo } from "react";
import { isWithinWindow, buildLockedTitle } from "@/utils/dateCardHelpers";

export function useDateCardComputed(dateModel, hasLocationPermission, userId) {
  return useMemo(() => {
    const baseStatus = dateModel?.dateStatus || "none";

    const inWindow = isWithinWindow(dateModel?.dateStart, dateModel?.dateEnd);

    let effectiveStatus = baseStatus;
    if (baseStatus === "locked" && inWindow && hasLocationPermission) {
      effectiveStatus = "ready";
    }

    if (baseStatus === "expired") {
      effectiveStatus = "expired";
    }

    const proposedByMe =
      baseStatus === "proposed" &&
      Number(dateModel?.proposedByUserId) === Number(userId);

    const title =
      effectiveStatus === "none"
        ? "🍸 Plan a date"
        : effectiveStatus === "proposed"
          ? "Date proposed"
          : effectiveStatus === "ready"
            ? "Ready to unlock 🍸"
            : effectiveStatus === "unlocked"
              ? "Unlocked 🍸"
              : effectiveStatus === "expired"
                ? "Missed this one"
                : buildLockedTitle(
                    dateModel?.dateStart,
                    dateModel?.dateEnd,
                    dateModel?.activityLabel,
                    dateModel?.placeLabel,
                  );

    const buttonLabel =
      effectiveStatus === "none"
        ? "Plan Date"
        : effectiveStatus === "proposed"
          ? "Review"
          : effectiveStatus === "ready"
            ? "Meet & Unlock"
            : effectiveStatus === "unlocked"
              ? "Use Credit"
              : effectiveStatus === "expired"
                ? "Plan Again"
                : "Details";

    const showWaitingPill = effectiveStatus === "proposed" && proposedByMe;

    return {
      baseStatus,
      effectiveStatus,
      inWindow,
      proposedByMe,
      title,
      buttonLabel,
      showWaitingPill,
    };
  }, [dateModel, hasLocationPermission, userId]);
}
