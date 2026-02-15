import { View } from "react-native";
import { HiddenSectionHeader } from "./HiddenSectionHeader";
import { EmptyMessagesState } from "./EmptyMessagesState";
import { MessageListItem } from "./MessageListItem";

export function HiddenSection({
  archivedRows,
  hiddenExpanded,
  onToggle,
  onOpenThread,
}) {
  const hiddenCount = archivedRows.length;

  return (
    <>
      <HiddenSectionHeader
        hiddenCount={hiddenCount}
        hiddenExpanded={hiddenExpanded}
        onToggle={onToggle}
      />

      <View
        style={{
          height: 1,
          backgroundColor: "rgba(17,17,17,0.06)",
          marginHorizontal: 16,
          marginBottom: 10,
        }}
      />

      {archivedRows.length === 0 ? (
        <EmptyMessagesState section="hidden" />
      ) : hiddenExpanded ? (
        <View style={{ paddingHorizontal: 16 }}>
          {archivedRows.map((m, idx) => (
            <View
              key={String(m.match_id || `arch-${idx}`)}
              style={{ marginBottom: 12, opacity: 0.9 }}
            >
              <MessageListItem match={m} onPress={onOpenThread} />
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
