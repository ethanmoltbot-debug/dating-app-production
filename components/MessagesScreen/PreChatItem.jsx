import { View, Text } from "react-native";
import { MessageListItem } from "./MessageListItem";
import { formatDecision } from "@/utils/messagesScreenHelpers";

export function PreChatItem({ match, onPress, firstMatchRef }) {
  const role = String(match?.prechat_role || "");
  const waiting = role === "sender";
  const myConsented = Boolean(match?.my_consented);

  const secondsRemaining = Number(match?.decision_seconds_remaining);
  const timerLine = formatDecision(secondsRemaining);

  const statusLine = myConsented
    ? "Pending"
    : waiting
      ? "Waiting on response"
      : null;

  return (
    <View style={{ marginBottom: 12 }}>
      <MessageListItem
        match={match}
        onPress={onPress}
        firstMatchRef={firstMatchRef}
      />

      {String(match?.terminal_state || "") ? null : statusLine || timerLine ? (
        <View
          style={{
            marginTop: -6,
            marginLeft: 18,
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {statusLine ? (
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: "#6B7280",
              }}
            >
              {statusLine}
            </Text>
          ) : null}

          {timerLine ? (
            <Text
              style={{
                fontSize: 12,
                fontWeight: waiting ? "800" : "900",
                color: waiting ? "#6B7280" : "#111",
              }}
            >
              {timerLine}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
