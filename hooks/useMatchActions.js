import { useCallback } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { useQueryClient } from "@tanstack/react-query";

export function useMatchActions(matchId, matchInfo, user, router) {
  const queryClient = useQueryClient();

  const handleCall = useCallback(async () => {
    const phoneNumber = matchInfo?.otherUser?.phoneNumber;
    const displayName = matchInfo?.otherUser?.displayName || "this user";

    if (!phoneNumber) {
      Alert.alert(
        "No phone number",
        `${displayName} hasn't added a phone number yet.`,
      );
      return;
    }

    try {
      const url = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Can't call", "This device can't start phone calls.");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.error("Could not start phone call", e);
      Alert.alert("Call failed", "Could not start the phone call.");
    }
  }, [matchInfo?.otherUser?.displayName, matchInfo?.otherUser?.phoneNumber]);

  const weMet = useCallback(async () => {
    if (!user?.id) return;

    const name = matchInfo?.otherUser?.displayName || "this person";

    Alert.alert(
      "We met?",
      `This will log that you met ${name}. We may ask you for quick feedback later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: async () => {
            try {
              const resp = await fetch(`/api/matches/${matchId}/we-met`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
              });
              if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                throw new Error(
                  `When posting /api/matches/${matchId}/we-met, the response was [${resp.status}] ${resp.statusText} ${text}`,
                );
              }

              // Refresh anything that might surface a feedback prompt.
              queryClient.invalidateQueries({
                queryKey: ["pendingDateFeedback"],
              });
              queryClient.invalidateQueries({
                queryKey: ["matchesSummary", user.id],
              });
              queryClient.invalidateQueries({
                queryKey: ["matchesForBadge", Number(user.id)],
              });

              Alert.alert("Noted", "Got it. Thanks for letting us know.");
            } catch (e) {
              console.error("Could not mark we met", e);
              Alert.alert("Couldn’t save", "Please try again.");
            }
          },
        },
      ],
    );
  }, [matchId, matchInfo?.otherUser?.displayName, queryClient, user?.id]);

  const unmatch = useCallback(
    async ({ reasonCode, reasonText } = {}) => {
      if (!user?.id) return;

      try {
        const payload = {
          userId: user.id,
        };

        if (reasonCode) {
          payload.reasonCode = reasonCode;
        }

        if (reasonText) {
          payload.reasonText = reasonText;
        }

        const resp = await fetch(`/api/matches/${matchId}/unmatch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(
            `When posting /api/matches/${matchId}/unmatch, the response was [${resp.status}] ${resp.statusText} ${text}`,
          );
        }

        queryClient.invalidateQueries({
          queryKey: ["matchesSummary", user.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["matchesForBadge", Number(user.id)],
        });

        router.replace("/messages");
      } catch (e) {
        console.error("Could not unmatch", e);
        Alert.alert("Unmatch failed", "Could not unmatch right now.");
      }
    },
    [matchId, queryClient, router, user?.id],
  );

  const blockUser = useCallback(async () => {
    if (!user?.id) return;

    const name = matchInfo?.otherUser?.displayName || "this user";

    Alert.alert(
      `Block ${name}?`,
      "They won't be able to match or message you again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const resp = await fetch(`/api/matches/${matchId}/block`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
              });
              if (!resp.ok) {
                throw new Error(
                  `When posting /api/matches/${matchId}/block, the response was [${resp.status}] ${resp.statusText}`,
                );
              }
              queryClient.invalidateQueries({
                queryKey: ["matchesSummary", user.id],
              });
              router.replace("/messages");
            } catch (e) {
              console.error("Could not block user", e);
              Alert.alert("Block failed", "Could not block right now.");
            }
          },
        },
      ],
    );
  }, [
    matchId,
    matchInfo?.otherUser?.displayName,
    queryClient,
    router,
    user?.id,
  ]);

  return {
    handleCall,
    weMet,
    unmatch,
    blockUser,
  };
}
