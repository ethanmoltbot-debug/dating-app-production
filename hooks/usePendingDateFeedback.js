import { useQuery } from "@tanstack/react-query";

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `When fetching ${url}, the response was [${resp.status}] ${resp.statusText}. ${text}`,
    );
  }
  return resp.json();
}

export function usePendingDateFeedback(userId) {
  const uid = Number(userId);
  const enabled = Number.isFinite(uid);

  return useQuery({
    queryKey: ["pendingDateFeedback", uid],
    enabled,
    queryFn: async () => {
      const data = await fetchJson(`/api/date-feedback/pending?userId=${uid}`);
      const pending = Array.isArray(data?.pending) ? data.pending : [];
      return { pending };
    },
    staleTime: 0,
    refetchInterval: 60_000,
  });
}
