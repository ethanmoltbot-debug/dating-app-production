import { View, Text, ActivityIndicator } from "react-native";

export function PurchaseCard({
  priceText,
  priceLoading,
  purchaseNotice,
  purchaseSyncing,
}) {
  const showPrice = priceText && String(priceText).trim().length > 0;

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
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
        1 date credit
      </Text>

      <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
        Unlock matches and send pre-chats.
      </Text>

      <View
        style={{
          marginTop: 12,
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 16,
          backgroundColor: "rgba(124, 58, 237, 0.08)",
          borderWidth: 1,
          borderColor: "rgba(124, 58, 237, 0.14)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
          Price
        </Text>

        {priceLoading ? (
          <ActivityIndicator size="small" color="#7C3AED" />
        ) : (
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
            {showPrice ? priceText : "—"}
          </Text>
        )}
      </View>

      {purchaseNotice ? (
        <View
          style={{
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            backgroundColor: "rgba(17,17,17,0.04)",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: "#111",
              fontWeight: "800",
              flex: 1,
            }}
          >
            {purchaseNotice}
          </Text>
          {purchaseSyncing ? (
            <View style={{ marginLeft: 10 }}>
              <ActivityIndicator size="small" color="#7C3AED" />
            </View>
          ) : null}
        </View>
      ) : null}

      <Text
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "#6B7280",
          lineHeight: 16,
        }}
      >
        You’ll confirm this purchase with Apple. If it takes a bit to show up,
        it’s still processing.
      </Text>
    </View>
  );
}
