import { View, Text } from "react-native";

export function CreditSheet({ dateModel }) {
  const creditDollars = (
    Number(dateModel?.creditAmountCents || 0) / 100
  ).toFixed(0);

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E5E5",
          borderRadius: 14,
          padding: 12,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#2D2D2D" }}>
          ${creditDollars} drink credit
        </Text>
        <Text style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
          Status: {String(dateModel?.creditStatus || "pending")}
        </Text>
        {dateModel?.creditExpiresAt ? (
          <Text style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
            Expires: {new Date(dateModel.creditExpiresAt).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
