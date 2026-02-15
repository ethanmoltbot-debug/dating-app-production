import { View, Text } from "react-native";
import { TouchableOpacity } from "react-native";

export function MessagesHeader({
  insets,
  credits = 0,
  maxCredits = 3,
  onPressCredits,
}) {
  const safeCredits = Number.isFinite(Number(credits)) ? Number(credits) : 0;
  const safeMax = Number.isFinite(Number(maxCredits)) ? Number(maxCredits) : 3;
  const filled = Math.max(0, Math.min(safeMax, safeCredits));
  const stockedUp = safeMax > 0 && filled >= safeMax;

  return (
    <View
      style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 12,
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.84)",
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 30, fontWeight: "900", letterSpacing: -0.6 }}>
          <Text style={{ color: "#7C3AED" }}>wi</Text>
          <Text style={{ color: "#FF4FD8" }}>fey</Text>
        </Text>

        {/* date credit counter */}
        <TouchableOpacity
          onPress={onPressCredits}
          activeOpacity={0.9}
          style={{
            marginTop: 10,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(124, 58, 237, 0.08)",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: "rgba(124, 58, 237, 0.14)",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
            {stockedUp ? "Stocked up" : "Date credits"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 10,
            }}
          >
            {Array.from({ length: safeMax }).map((_, idx) => {
              const isOn = idx < filled;
              return (
                <View
                  key={idx}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: isOn ? "#FF4FD8" : "rgba(17,17,17,0.12)",
                    marginRight: idx === safeMax - 1 ? 0 : 6,
                  }}
                />
              );
            })}
          </View>

          <Text
            style={{
              marginLeft: 10,
              fontSize: 12,
              fontWeight: "900",
              color: "#111",
            }}
          >
            {filled}/{safeMax}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
