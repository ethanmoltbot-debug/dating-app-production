import { View, Text } from "react-native";
import { Card } from "../Card";
import { SectionHeader } from "../SectionHeader";
import { THEME } from "../theme";

export function AboutSection({ bio }) {
  const hasBio = typeof bio === "string" && bio.trim().length > 0;
  if (!hasBio) {
    return null;
  }

  return (
    <Card style={{ padding: 16 }}>
      <SectionHeader title="About" />

      <Text
        style={{
          color: THEME.text,
          marginTop: 12,
          lineHeight: 20,
          fontWeight: "600",
        }}
      >
        {bio}
      </Text>
    </Card>
  );
}
