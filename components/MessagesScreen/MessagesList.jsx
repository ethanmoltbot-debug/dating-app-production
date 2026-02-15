import { ScrollView, View, Text, TouchableOpacity, Alert } from "react-native";
import { MessageListItem } from "./MessageListItem";
import { EmptyMessagesState } from "./EmptyMessagesState";
import { LockedChatSlot } from "./LockedChatSlot";

function daysBetween(dateA, dateB) {
  const a = dateA instanceof Date ? dateA : new Date(dateA);
  const b = dateB instanceof Date ? dateB : new Date(dateB);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function MessagesList({
  matches,
  insets,
  firstMatchRef,
  onMatchPress,

  // NEW focus-mode props
  activeMatchId,
  queuedCount,
  onPressOpenCurrentChat,
  onUnlockNext,

  // subscription upsell
  isCommitted,
  onPressUpgradeToCommitted,
}) {
  const safeMatches = Array.isArray(matches) ? matches : [];

  // CHANGE: empty state should be based on *visible chat rows*.
  // If the user has matches but none are committed yet, they should see the match queue above.
  if (safeMatches.length === 0) {
    return <EmptyMessagesState />;
  }

  const activeIdStr = activeMatchId ? String(activeMatchId) : null;
  const activeMatch = activeIdStr
    ? safeMatches.find((m) => String(m?.match_id) === activeIdStr)
    : null;

  const hasActive = Boolean(activeMatch);

  // If we are focused, only show the active conversation. Everything else is queued.
  if (hasActive) {
    const now = new Date();
    const lastActivity =
      activeMatch?.last_message_time || activeMatch?.created_at;

    const isDateCompleted =
      String(activeMatch?.date_status || "none") === "unlocked" &&
      Boolean(activeMatch?.date_end) &&
      (() => {
        const end = new Date(activeMatch.date_end);
        return Number.isFinite(end.getTime()) && end.getTime() <= now.getTime();
      })();

    const staleDays = lastActivity ? daysBetween(lastActivity, now) : null;
    const isStale = Number.isFinite(Number(staleDays))
      ? Number(staleDays) >= 5
      : false;

    const canUnlock = Boolean(queuedCount > 0) && (isDateCompleted || isStale);
    const unlockReasonText = isDateCompleted
      ? "Date completed — you can unlock your next match."
      : isStale
        ? "No activity for a bit — you can exit this path and unlock the next."
        : null;

    const showUpgradeSlots = !isCommitted;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 90,
        }}
      >
        <MessageListItem match={activeMatch} onPress={onMatchPress} />

        {showUpgradeSlots ? (
          <View style={{ marginTop: 12 }}>
            {[0, 1].map((i) => (
              <LockedChatSlot
                key={`locked-slot-${i}`}
                index={i}
                onPress={() => onPressUpgradeToCommitted?.()}
              />
            ))}
          </View>
        ) : null}

        {unlockReasonText ? (
          <View
            style={{
              marginTop: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor: "rgba(255,255,255,0.76)",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "900", color: "#111" }}>
              {unlockReasonText}
            </Text>

            {canUnlock ? (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Unlock next match?",
                    "This will end your current focus and reveal your queued matches.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Unlock",
                        style: "destructive",
                        onPress: () => onUnlockNext?.(),
                      },
                    ],
                  );
                }}
                activeOpacity={0.9}
                style={{
                  marginTop: 10,
                  alignSelf: "flex-start",
                  backgroundColor: "#111",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  Unlock next
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  // CHANGE: No active focus yet: show only committed chats (the caller should pass only committed matches).
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 90,
      }}
    >
      {safeMatches.map((match, idx) => (
        <MessageListItem
          key={match.match_id}
          match={match}
          onPress={onMatchPress}
          firstMatchRef={idx === 0 ? firstMatchRef : null}
        />
      ))}
    </ScrollView>
  );
}
