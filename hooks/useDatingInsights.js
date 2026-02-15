import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export function useDatingInsights(profile, showDatingInsights) {
  const targetUserId = useMemo(() => {
    const n1 = Number(profile?.user_id);
    if (Number.isFinite(n1) && n1 > 0) return Math.trunc(n1);

    const n2 = Number(profile?.id);
    if (Number.isFinite(n2) && n2 > 0) return Math.trunc(n2);

    return null;
  }, [profile?.id, profile?.user_id]);

  const shouldFetchInsights =
    showDatingInsights && Number.isFinite(targetUserId);

  const insightsQuery = useQuery({
    queryKey: ["datingInsights", "profile", targetUserId],
    enabled: shouldFetchInsights,
    queryFn: async () => {
      const resp = await fetch(
        `/api/dating-insights?userId=${encodeURIComponent(String(targetUserId))}`,
      );
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/dating-insights, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      return resp.json();
    },
    staleTime: 30_000,
  });

  const dateHistoryLabel =
    typeof insightsQuery.data?.dateHistoryLabel === "string"
      ? insightsQuery.data.dateHistoryLabel
      : null;

  const followThroughLabel =
    typeof insightsQuery.data?.followThroughLabel === "string"
      ? insightsQuery.data.followThroughLabel
      : null;

  const dateHistoryLine = useMemo(() => {
    if (!showDatingInsights) return null;
    if (!shouldFetchInsights) return null;

    if (insightsQuery.isLoading) {
      return "Loading…";
    }

    if (insightsQuery.isError) {
      return "Unavailable";
    }

    return dateHistoryLabel || "0 dates on Wifey";
  }, [
    dateHistoryLabel,
    insightsQuery.isError,
    insightsQuery.isLoading,
    shouldFetchInsights,
    showDatingInsights,
  ]);

  const followThroughLine = useMemo(() => {
    if (!showDatingInsights) return null;
    if (!shouldFetchInsights) return null;

    if (insightsQuery.isLoading) {
      return "Loading…";
    }

    if (insightsQuery.isError) {
      return "Unavailable";
    }

    return followThroughLabel || "Not enough data yet";
  }, [
    followThroughLabel,
    insightsQuery.isError,
    insightsQuery.isLoading,
    shouldFetchInsights,
    showDatingInsights,
  ]);

  return {
    shouldFetchInsights,
    insightsQuery,
    dateHistoryLine,
    followThroughLine,
  };
}
