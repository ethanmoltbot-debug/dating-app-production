import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url, options) {
  const resp = await fetch(url, options);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `When fetching ${url}, the response was [${resp.status}] ${resp.statusText}. ${text}`,
    );
  }
  return resp.json();
}

export function useDrinkPerk(matchId, userId) {
  const queryClient = useQueryClient();

  const canQuery = Boolean(matchId) && Number.isFinite(Number(userId));

  const perkQuery = useQuery({
    queryKey: ["drinkPerk", String(matchId), Number(userId)],
    enabled: canQuery,
    queryFn: async () => {
      return fetchJson(`/api/drink-perk/${matchId}?userId=${Number(userId)}`);
    },
    staleTime: 0,
    refetchInterval: 10_000,
  });

  const pingLocationMutation = useMutation({
    mutationFn: async ({ lat, lng, accuracyM }) => {
      return fetchJson(`/api/drink-perk/${matchId}/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          lat,
          lng,
          accuracyM,
        }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["drinkPerk", String(matchId), Number(userId)],
      });
    },
  });

  const startHandshakeMutation = useMutation({
    mutationFn: async () => {
      return fetchJson(`/api/drink-perk/${matchId}/handshake/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId) }),
      });
    },
  });

  const confirmHandshakeMutation = useMutation({
    mutationFn: async ({ code }) => {
      return fetchJson(`/api/drink-perk/${matchId}/handshake/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), code }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["drinkPerk", String(matchId), Number(userId)],
      });
    },
  });

  const statusQuery = useQuery({
    queryKey: ["drinkHandshake", String(matchId), Number(userId)],
    enabled: false,
    queryFn: async () => {
      return fetchJson(
        `/api/drink-perk/${matchId}/handshake/status?userId=${Number(userId)}`,
      );
    },
    staleTime: 0,
  });

  const perkState = useMemo(() => {
    const state = String(perkQuery.data?.perk?.state || "LOCKED");
    return state;
  }, [perkQuery.data?.perk?.state]);

  const hasDatePlan = Boolean(perkQuery.data?.date?.hasDatePlan);

  const refetchAll = useCallback(async () => {
    await perkQuery.refetch();
  }, [perkQuery]);

  return {
    canQuery,
    perkQuery,
    perkState,
    hasDatePlan,
    pingLocationMutation,
    startHandshakeMutation,
    confirmHandshakeMutation,
    statusQuery,
    refetchAll,
  };
}
