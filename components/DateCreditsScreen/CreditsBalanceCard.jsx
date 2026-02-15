import { View, Text } from "react-native";
import { formatMoney } from "@/utils/dateCreditsHelpers";

export function CreditsBalanceCard({
  credits,
  maxCredits,
  balanceCents,
  stockedUp,
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.86)",
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
        Your balance
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 28,
          fontWeight: "900",
          color: "#111",
        }}
      >
        {credits}/{maxCredits} credits
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
        Wallet: {formatMoney(balanceCents)}
      </Text>

      <Text
        style={{
          marginTop: 12,
          fontSize: 13,
          color: "#6B7280",
          lineHeight: 18,
        }}
      >
        {stockedUp
          ? "You're stocked up. Use a credit to make room for more."
          : "You need 1 credit to unlock a match chat."}
      </Text>
    </View>
  );
}
