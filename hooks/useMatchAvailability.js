import { useQuery } from "@tanstack/react-query";

async function fetchMatchAvailability(matchId, userId) {
  const resp = await fetch(
    `/api/matches/${matchId}/availability?userId=${Number(userId)}`,
  );
  if (!resp.ok) {
    throw new Error(
      `When fetching /api/matches/${matchId}/availability, the response was [${resp.status}] ${resp.statusText}`,
    );
  }
  return resp.json();
}

export function useMatchAvailability(matchId, userId) {
  const canQuery = Boolean(matchId) && Number.isFinite(Number(userId));

  return useQuery({
    queryKey: ["matchAvailability", String(matchId), Number(userId)],
    enabled: canQuery,
    queryFn: () => fetchMatchAvailability(matchId, userId),
  });
}
