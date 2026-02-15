import { View } from "react-native";
import { SectionHeader } from "./SectionHeader";
import { EmptyMessagesState } from "./EmptyMessagesState";
import { PreChatItem } from "./PreChatItem";
import { ClosedChatItem } from "./ClosedChatItem";

export function PreChatsSection({
  preChatRows,
  closedRows,
  onOpenThread,
  firstMatchRef,
}) {
  return (
    <>
      <SectionHeader title="Pre-Chats" />

      {preChatRows.length === 0 && closedRows.length === 0 ? (
        <EmptyMessagesState section="preChats" />
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          {preChatRows.map((m, idx) => (
            <PreChatItem
              key={String(m.match_id || idx)}
              match={m}
              onPress={onOpenThread}
              firstMatchRef={idx === 0 ? firstMatchRef : null}
            />
          ))}

          {closedRows.map((m, idx) => (
            <ClosedChatItem
              key={String(m.match_id || `closed-${idx}`)}
              match={m}
            />
          ))}
        </View>
      )}
    </>
  );
}
