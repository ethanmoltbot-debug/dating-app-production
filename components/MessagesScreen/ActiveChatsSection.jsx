import { View } from "react-native";
import { SectionHeader } from "./SectionHeader";
import { EmptyMessagesState } from "./EmptyMessagesState";
import { MessageListItem } from "./MessageListItem";
import { CommittedUpgradeCard } from "./CommittedUpgradeCard";

export function ActiveChatsSection({
  activeVisible,
  activeChatRows,
  isCommitted,
  otherChatsHidden,
  onOpenThread,
  onOpenCommittedUpgrade,
}) {
  return (
    <>
      <SectionHeader title="Active Chat" />

      {activeVisible.length === 0 ? (
        <EmptyMessagesState section="activeChats" />
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          {activeVisible.map((m, idx) => (
            <MessageListItem
              key={String(m.match_id || idx)}
              match={m}
              onPress={onOpenThread}
            />
          ))}

          {!otherChatsHidden && !isCommitted && activeChatRows.length < 3 ? (
            <CommittedUpgradeCard onPress={onOpenCommittedUpgrade} />
          ) : null}
        </View>
      )}
    </>
  );
}
