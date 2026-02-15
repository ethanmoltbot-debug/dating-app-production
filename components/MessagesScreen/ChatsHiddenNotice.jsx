import { View, Text } from "react-native";
import { LockedChatSlot } from "./LockedChatSlot";

export function ChatsHiddenNotice({ isCommitted, onOpenCommittedUpgrade }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.72)",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "900", color: "#111" }}>
          Matches and pre-chats are hidden
        </Text>
        <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
          End an active chat (unmatch, block, or mark that you met) to see them
          again.
        </Text>
      </View>

      {!isCommitted ? (
        <View style={{ marginTop: 12 }}>
          <LockedChatSlot index={0} onPress={onOpenCommittedUpgrade} />
        </View>
      ) : null}
    </View>
  );
}
