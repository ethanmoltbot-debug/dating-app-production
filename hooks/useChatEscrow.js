import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url, options) {
  const resp = await fetch(url, options);
  const text = await resp.text().catch(() => "");

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!resp.ok) {
    const msg = json?.error || json?.message || text || "Request failed";
    const err = new Error(
      `When fetching ${url}, the response was [${resp.status}] ${resp.statusText}. ${msg}`,
    );
    err.status = resp.status;
    err.data = json;
    throw err;
  }

  return json;
}

export function useChatEscrow(matchId, userId, tier) {
  const queryClient = useQueryClient();

  const canQuery = Boolean(matchId) && Number.isFinite(Number(userId));

  const tierParam = useMemo(() => {
    const t = String(tier || "")
      .toLowerCase()
      .trim();
    if (t === "committed" || t === "serious") return t;
    return null;
  }, [tier]);

  const statusQuery = useQuery({
    queryKey: ["chatEscrow", String(matchId), Number(userId), tierParam],
    enabled: canQuery,
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("userId", String(Number(userId)));
      if (tierParam) {
        qs.set("tier", tierParam);
      }
      return fetchJson(`/api/chat-escrow/${matchId}?${qs.toString()}`);
    },
    staleTime: 0,
    refetchInterval: 10_000,
  });

  const commitMutation = useMutation({
    mutationFn: async () => {
      return fetchJson(`/api/chat-escrow/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          tier: tierParam,
        }),
      });
    },
    onSuccess: async () => {
      // Invalidate all chat escrow status queries (covers tier changes too)
      await queryClient.invalidateQueries({ queryKey: ["chatEscrow"] });
    },
  });

  const status = useMemo(() => {
    return statusQuery.data?.status || null;
  }, [statusQuery.data?.status]);

  return {
    canQuery,
    statusQuery,
    status,
    commitMutation,
  };
}
