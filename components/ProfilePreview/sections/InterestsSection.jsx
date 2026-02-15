import { View, Text } from "react-native";
import { Card } from "../Card";
import { SectionHeader } from "../SectionHeader";
import { THEME } from "../theme";

export function InterestsSection({ interests }) {
  const hasInterests = Array.isArray(interests) && interests.length > 0;
  if (!hasInterests) {
    return null;
  }

  return (
    <Card style={{ padding: 16 }}>
      <SectionHeader title="Interests" />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 12,
          gap: 8,
        }}
      >
        {interests.map((tag, idx) => (
          <View
            key={`${tag}-${idx}`}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: "rgba(17,24,39,0.03)",
              borderWidth: 1,
              borderColor: "rgba(17,24,39,0.06)",
            }}
          >
            <Text style={{ color: THEME.text, fontWeight: "800" }}>{tag}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
