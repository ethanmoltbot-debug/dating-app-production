import { View, Text } from "react-native";
import { BenefitRow } from "./BenefitRow";

export function BenefitsSection({ benefits, benefitsHeader }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
      <View
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#E5E5EA",
          backgroundColor: "#fff",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            fontWeight: "500",
          }}
        >
          {benefitsHeader}
        </Text>

        <View style={{ marginTop: 10 }}>
          {benefits.map((b, idx) => {
            const isLast = idx === benefits.length - 1;
            return (
              <View key={`${b.title}-${idx}`}>
                <BenefitRow
                  icon={b.icon}
                  title={b.title}
                  subtitle={b.subtitle}
                />
                {!isLast ? (
                  <View style={{ height: 1, backgroundColor: "#F0F0F0" }} />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <Text
        style={{
          marginTop: 14,
          fontSize: 12,
          color: "#6B7280",
          lineHeight: 18,
          textAlign: "center",
          paddingHorizontal: 8,
        }}
      >
        Dates are always paid separately. Subscriptions unlock control, clarity,
        and trust — not shortcuts.
      </Text>
    </View>
  );
}
