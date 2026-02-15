import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocalSearchParams } from "expo-router";

export function useMessagesChatCredit(
  matches,
  hasCommittedAny,
  loadMatches,
  userId,
) {
  const [creditGateOpen, setCreditGateOpen] = useState(false);
  const [creditGateMatchId, setCreditGateMatchId] = useState(null);
  // NEW: track why the gate is open (tap vs deep-link redirect)
  const [creditGateSource, setCreditGateSource] = useState(null); // 'tap' | 'deeplink' | null

  const params = useLocalSearchParams();

  const matchIdParam = useMemo(() => {
    const raw = params?.matchId;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const s = v != null ? String(v).trim() : "";
    return s || null;
  }, [params?.matchId]);

  // If we were redirected here from a chat deep-link, open the credit gate for that match.
  useEffect(() => {
    if (!matchIdParam) return;
    setCreditGateMatchId(matchIdParam);
    setCreditGateSource("deeplink");
    setCreditGateOpen(true);
  }, [matchIdParam]);

  // NOTE: We no longer auto-open the credit modal when the Messages tab mounts.
  // The modal should appear when the user tries to open a chat without a date credit.

  const handleCreditCommitted = useCallback(async () => {
    setCreditGateOpen(false);
    if (userId) {
      await loadMatches(userId);
    }
  }, [loadMatches, userId]);

  const handleCreditClose = useCallback(() => {
    setCreditGateOpen(false);
    setCreditGateMatchId(null);
    setCreditGateSource(null);
  }, []);

  const openCreditGate = useCallback((matchId) => {
    setCreditGateMatchId(String(matchId));
    setCreditGateSource("tap");
    setCreditGateOpen(true);
  }, []);

  return {
    creditGateOpen,
    creditGateMatchId,
    creditGateSource,
    setCreditGateOpen,
    setCreditGateMatchId,
    handleCreditCommitted,
    handleCreditClose,
    openCreditGate,
  };
}
