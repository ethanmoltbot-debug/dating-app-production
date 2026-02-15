import { useQuery } from "@tanstack/react-query";

export function useDateCardQuery(matchId, userId) {
  const canQuery = Boolean(matchId) && Number.isFinite(Number(userId));

  return useQuery({
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
    refetchInterval: (data) => {
      const status = data?.date?.dateStatus;
      if (status === "locked" || status === "proposed") return 30_000;
      return false;
    },
  });
}
