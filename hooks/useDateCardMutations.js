import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

export function useDateCardMutations(matchId, userId, sheetRef, options = {}) {
  const queryClient = useQueryClient();
  const onAfterMutation =
    typeof options?.onAfterMutation === "function"
      ? options.onAfterMutation
      : null;

  const proposeMutation = useMutation({
    mutationFn: async ({
      dateStart,
      dateEnd,
      activityLabel,
      placeLabel,
      placeId,
    }) => {
      const resp = await fetch(`/api/matches/${matchId}/date/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          dateStart,
          dateEnd,
          activityLabel,
          placeLabel,
          placeId,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/matches/${matchId}/date/propose, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      return resp.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({
        queryKey: ["matchDate", String(matchId), Number(userId)],
      });
      sheetRef.current?.close();

      try {
        await onAfterMutation?.({ kind: "propose", data });
      } catch (e) {
        console.error(e);
      }
    },
    onError: (e) => {
      console.error(e);
      Alert.alert("Could not propose", "Please try again.");
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ response }) => {
      const resp = await fetch(`/api/matches/${matchId}/date/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), response }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/matches/${matchId}/date/respond, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      return resp.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({
        queryKey: ["matchDate", String(matchId), Number(userId)],
      });
      sheetRef.current?.close();

      try {
        await onAfterMutation?.({ kind: "respond", data });
      } catch (e) {
        console.error(e);
      }
    },
    onError: (e) => {
      console.error(e);
      Alert.alert("Could not update", "Please try again.");
    },
  });

  return { proposeMutation, respondMutation };
}
