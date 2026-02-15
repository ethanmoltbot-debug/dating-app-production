import { View, Text } from "react-native";

export function ProgressBar({ step, totalSteps, stepTitle }) {
  const progressPct = ((step + 1) / totalSteps) * 100;

  return (
    <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>
      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(17,17,17,0.08)",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${progressPct}%`,
            backgroundColor: "rgba(124,58,237,0.75)",
          }}
        />
      </View>
      <Text
        style={{
          marginTop: 10,
          textAlign: "center",
          fontSize: 14,
          color: "#6B7280",
          fontWeight: "800",
        }}
      >
        {stepTitle}
      </Text>
    </View>
  );
}
