import { View, Text } from "react-native";
import { MessageListItem } from "./MessageListItem";

export function ClosedChatItem({ match }) {
  const term = String(match?.terminal_state || "");
  const label = term === "expired" ? "Expired" : "No longer available";

  return (
    <View style={{ marginBottom: 12, opacity: 0.72 }}>
      <MessageListItem match={match} onPress={() => {}} />
      <View style={{ marginTop: -10, marginLeft: 18 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "900",
            color: "#6B7280",
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
