import { useQuery } from "@tanstack/react-query";

export function useConversationStarter(matchId, userId) {
  const enabled = Boolean(matchId) && Number.isFinite(Number(userId));

  const query = useQuery({
    queryKey: ["conversationStarter", String(matchId || ""), Number(userId)],
    enabled,
    queryFn: async () => {
      const response = await fetch(
        `/api/matches/${encodeURIComponent(String(matchId))}/starter?userId=${encodeURIComponent(String(userId))}`,
      );
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `When fetching /api/matches/${String(matchId)}/starter, the response was [${response.status}] ${response.statusText}. ${text}`,
        );
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    starter: query.data?.starter || null,
    starterQuery: query,
  };
}
