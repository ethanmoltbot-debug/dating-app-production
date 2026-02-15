import { View } from "react-native";
import { Card } from "../Card";
import { SectionHeader } from "../SectionHeader";
import { BasicsPill } from "../BasicsPill";

export function BasicsSection({ basicsItems }) {
  if (basicsItems.length === 0) {
    return null;
  }

  return (
    <Card style={{ padding: 16 }}>
      <SectionHeader title="Basics" subtitle="Essentials" />

      <View style={{ marginTop: 12, gap: 10 }}>
        {basicsItems.map((it) => (
          <BasicsPill key={it.key} icon={it.icon} text={it.text} />
        ))}
      </View>
    </Card>
  );
}
