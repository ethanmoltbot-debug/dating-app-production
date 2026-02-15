import { View, Text } from "react-native";
import { Card } from "./Card";
import { Pill } from "./Pill";

export function SingleChoiceCard({ title, options, value, onChange }) {
  return (
    <Card>
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
        {title}
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 12,
        }}
      >
        {options.map((label) => {
          const active = value === label;
          return (
            <Pill
              key={label}
              label={label}
              active={active}
              onPress={() => onChange(label)}
            />
          );
        })}
      </View>
    </Card>
  );
}
