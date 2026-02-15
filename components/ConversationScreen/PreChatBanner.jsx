import { View, Text, TouchableOpacity } from "react-native";
import { formatDecisionShort } from "@/utils/conversationScreenHelpers";

export function PreChatBanner({
  realMessageCount,
  matchId,
  userId,
  preChatPromptDismissed,
  consentStatus,
  consentLoading,
  handleMoveToChat,
  moveBusy,
  setPreChatPromptDismissed,
}) {
  if (realMessageCount === 0) {
    return null;
  }

  if (!matchId || !userId || preChatPromptDismissed) {
    return null;
  }

  const s = consentStatus;
  if (!s) {
    return null;
  }

  const terminal = s?.terminalState;
  const isActive = Boolean(s?.isActive);

  if (terminal) {
    const line = terminal === "expired" ? "Expired" : "No longer available";
    return (
      <View
        style={{
          marginHorizontal: 14,
          marginTop: 8,
          marginBottom: 2,
          backgroundColor: "rgba(255,255,255,0.86)",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontWeight: "900", color: "#111", fontSize: 13 }}>
          {line}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
          This match is no longer available.
        </Text>
      </View>
    );
  }

  if (isActive) {
    return null;
  }

  const limit = Number(s?.myActiveChatLimit);
  const count = Number(s?.myActiveChatCount);
  const atLimit =
    Number.isFinite(limit) &&
    limit > 0 &&
    Number.isFinite(count) &&
    count >= limit;

  if (atLimit) {
    return (
      <View
        style={{
          marginHorizontal: 14,
          marginTop: 8,
          marginBottom: 2,
          backgroundColor: "rgba(255,255,255,0.86)",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontWeight: "900", color: "#111", fontSize: 13 }}>
          {`Active chat limit (${count}/${limit})`}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
          End an active chat (unmatch, block, or mark that you met) to start
          this one.
        </Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => setPreChatPromptDismissed(true)}
            activeOpacity={0.9}
            style={{
              backgroundColor: "rgba(17,17,17,0.06)",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
            }}
          >
            <Text style={{ color: "#111", fontWeight: "900" }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const seconds = Number(s?.decisionSecondsRemaining);
  const timerLine = formatDecisionShort(seconds);

  const myConsented = Boolean(s?.myConsented);
  const otherConsented = Boolean(s?.otherConsented);

  const title = myConsented
    ? "Pending"
    : otherConsented
      ? "Ready to start"
      : "Move to chat?";

  const subtitle = myConsented
    ? "This chat becomes active after mutual consent."
    : "Only mutual consent creates an active chat.";

  const showMove = !myConsented;

  return (
    <View
      style={{
        marginHorizontal: 14,
        marginTop: 8,
        marginBottom: 2,
        backgroundColor: "rgba(255,255,255,0.86)",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "900", color: "#111", fontSize: 13 }}>
          {consentLoading ? "Loading…" : title}
        </Text>
        {timerLine ? (
          <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
            {timerLine}
          </Text>
        ) : null}
      </View>

      {subtitle ? (
        <Text style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
          {subtitle}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => setPreChatPromptDismissed(true)}
          activeOpacity={0.9}
          style={{
            backgroundColor: "rgba(17,17,17,0.06)",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
          }}
        >
          <Text style={{ color: "#111", fontWeight: "900" }}>Not now</Text>
        </TouchableOpacity>

        {showMove ? (
          <TouchableOpacity
            onPress={handleMoveToChat}
            disabled={moveBusy}
            activeOpacity={0.9}
            style={{
              backgroundColor: "#111",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              opacity: moveBusy ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {moveBusy ? "Moving…" : "Move to chat"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
