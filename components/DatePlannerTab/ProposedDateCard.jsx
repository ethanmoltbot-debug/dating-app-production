import { View, Text } from "react-native";
import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

export function ProposedDateCard({ lockedTitle, onAccept, onDecline, busy }) {
  return (
    <Card>
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
        Proposed date
      </Text>
      <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
        {lockedTitle}
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <SecondaryButton label="Decline" onPress={onDecline} disabled={busy} />
        <PrimaryButton label="Accept" onPress={onAccept} disabled={busy} />
      </View>
    </Card>
  );
}
