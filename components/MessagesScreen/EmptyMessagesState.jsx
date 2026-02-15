import { View, Text } from "react-native";

export function EmptyMessagesState({ section }) {
  const messages = {
    matches:
      "No matches yet. When you match with someone, they'll show up here.",
    preChats: "When someone sends a first message, it'll show up here.",
    activeChats:
      "No active chat yet. When you both move to chat, it'll appear here.",
    hidden: 'After you review a date (or mark "we met"), the chat moves here.',
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 6 }}>
      <Text style={{ color: "#6B7280" }}>
        {messages[section] || "No items to display."}
      </Text>
    </View>
  );
}
