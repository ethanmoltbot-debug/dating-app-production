import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

export function useMessagesAutoRefresh({
  user,
  closedRows,
  loadMatches,
  markMatchesSeen,
  refreshCredits,
  hasCredits,
  attemptRestoreCredits,
}) {
  // Refresh when returning to tab
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;

      // Keep these cheap and non-blocking
      markMatchesSeen(user.id);
      loadMatches(user.id);
      refreshCredits(user.id);

      // NEW: if they're locked but they just completed a purchase,
      // try a one-shot restore+claim here so they don't get stuck.
      if (!hasCredits && typeof attemptRestoreCredits === "function") {
        attemptRestoreCredits(user.id).catch(() => null);
      }
    }, [
      attemptRestoreCredits,
      hasCredits,
      loadMatches,
      markMatchesSeen,
      refreshCredits,
      user?.id,
    ]),
  );

  // Auto-refresh if we have terminal rows (so they auto-dismiss)
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      const hasTerminal = (closedRows?.length || 0) > 0;
      if (!hasTerminal) return;

      const id = setTimeout(() => {
        loadMatches(user.id);
      }, 4000);

      return () => clearTimeout(id);
    }, [closedRows?.length, loadMatches, user?.id]),
  );
}
