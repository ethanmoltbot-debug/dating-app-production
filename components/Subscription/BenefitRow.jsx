import { View, Text } from "react-native";

export function BenefitRow({ icon, title, subtitle }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingVertical: 10 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#F5F5F5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: "#111", fontWeight: "500" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginTop: 4,
              lineHeight: 18,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
