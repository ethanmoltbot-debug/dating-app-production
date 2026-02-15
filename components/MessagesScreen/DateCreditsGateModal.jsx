import { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function DateCreditsGateModal({
  visible,
  credits = 0,
  onPressBuy,
  onDismiss,
  bottomOffset = 0,
}) {
  const creditsSafe = Number(credits || 0);
  const bottomSafe = Math.max(0, Number(bottomOffset || 0));

  const creditLine = useMemo(() => {
    if (creditsSafe === 1) return "1 date credit";
    return `${creditsSafe} date credits`;
  }, [creditsSafe]);

  const handleBuy = useCallback(() => {
    onPressBuy?.();
  }, [onPressBuy]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

  if (!visible) {
    return null;
  }

  // NEW: This is a non-blocking nudge (not a full-screen gate).
  // Users can still browse matches and pre-chats without credits.
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: bottomSafe + 10,
        zIndex: 9999,
        elevation: 9999,
        paddingHorizontal: 14,
      }}
    >
      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 18,
          padding: 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.55)",
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.88)",
            borderRadius: 14,
            padding: 12,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "900", color: "#111" }}>
              Add a date credit to start an active chat
            </Text>

            <TouchableOpacity
              onPress={handleDismiss}
              activeOpacity={0.9}
              style={{ paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ color: "#111", fontWeight: "900" }}>Close</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#6B7280",
              lineHeight: 16,
            }}
          >
            You can still view your matches and send pre-chat messages. A date
            credit is only required when both of you move into an active chat.
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              onPress={handleBuy}
              activeOpacity={0.9}
              style={{ flex: 1, borderRadius: 14, overflow: "hidden" }}
            >
              <LinearGradient
                colors={CTA_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  Buy date credit
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={{
                justifyContent: "center",
                paddingHorizontal: 8,
                borderRadius: 12,
                backgroundColor: "rgba(17,17,17,0.04)",
              }}
            >
              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                {creditLine}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
