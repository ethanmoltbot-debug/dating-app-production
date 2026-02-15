import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

export function useMessagesNavigation({
  tier,
  user,
  loadMatches,
  onNeedCredits,
}) {
  const router = useRouter();

  const openCreditsPurchase = useCallback(() => {
    try {
      const qs = new URLSearchParams();
      qs.set("returnTo", "/messages");
      router.push(`/date-credits?${qs.toString()}`);
    } catch (e) {
      console.error(e);
      router.push("/date-credits");
    }
  }, [router]);

  const openCommittedUpgrade = useCallback(() => {
    try {
      const qs = new URLSearchParams();
      qs.set("returnTo", "/messages");
      qs.set("intent", "conversation_limit");
      qs.set("tier", "committed");
      router.push(`/subscription?${qs.toString()}`);
    } catch (e) {
      console.error(e);
      router.push("/subscription");
    }
  }, [router]);

  const openThread = useCallback(
    (match) => {
      const matchIdValue =
        match?.match_id != null ? String(match.match_id) : "";
      if (!matchIdValue) return;

      try {
        router.push(`/messages/${encodeURIComponent(matchIdValue)}`);
      } catch (e) {
        console.error(e);
        Alert.alert(
          "Could not open",
          "Could not open this chat. Please try again.",
        );
      }
    },
    [router],
  );

  const moveToChat = useCallback(
    async (match) => {
      const matchIdValue =
        match?.match_id != null ? String(match.match_id) : "";
      if (!matchIdValue || !user?.id) return;

      try {
        const resp = await fetch(`/api/conversations/consent/${matchIdValue}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: Number(user.id), tier }),
        });

        if (!resp.ok) {
          if (resp.status === 410) {
            Alert.alert(
              "No longer available",
              "This match is no longer available.",
            );
            await loadMatches(user.id);
            return;
          }

          if (resp.status === 402) {
            const data = await resp.json().catch(() => null);
            const missing = Array.isArray(data?.missingUserIds)
              ? data.missingUserIds
                  .map((v) => Number(v))
                  .filter((n) => Number.isFinite(n))
              : [];

            const myId = Number(user.id);
            const iAmMissing = missing.includes(myId);

            if (iAmMissing) {
              try {
                onNeedCredits?.({ matchId: matchIdValue, intent: "move" });
              } catch (e) {
                console.error(e);
              }
              return;
            }

            Alert.alert(
              "Waiting on them",
              "This chat starts after both of you add a date credit.",
            );
            await loadMatches(user.id);
            return;
          }

          if (resp.status === 409) {
            const data = await resp.json().catch(() => null);
            const status = data?.status || null;

            const limit = Number(status?.myActiveChatLimit);
            const count = Number(status?.myActiveChatCount);
            const hasLimit = Number.isFinite(limit) && limit > 0;
            const limitWord = hasLimit && limit === 1 ? "chat" : "chats";

            const title =
              hasLimit && Number.isFinite(count)
                ? `Active chat limit (${count}/${limit})`
                : "Active chat limit";

            const message = hasLimit
              ? `You can only have ${limit} active ${limitWord} at a time. End one first, then try again.`
              : "You're already at your active chat limit. End an active chat first, then try again.";

            Alert.alert(title, message);
            await loadMatches(user.id);
            return;
          }

          const text = await resp.text().catch(() => "");
          throw new Error(
            `When posting /api/conversations/consent/${matchIdValue}, the response was [${resp.status}] ${resp.statusText}. ${text}`,
          );
        }

        const data = await resp.json();
        const status = data?.status;
        const activeNow = Boolean(status?.isActive);

        await loadMatches(user.id);

        if (activeNow) {
          Alert.alert("Chat started", "You're now in an active chat.");
        } else {
          Alert.alert("Moved to chat", "Pending activation.");
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Could not move to chat", "Please try again.");
      }
    },
    [loadMatches, onNeedCredits, tier, user?.id],
  );

  return {
    openCreditsPurchase,
    openCommittedUpgrade,
    openThread,
    moveToChat,
  };
}
