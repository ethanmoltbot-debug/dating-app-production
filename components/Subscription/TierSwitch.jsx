import { View } from "react-native";
import { TierUnderlineTab } from "./TierUnderlineTab";
import { TIER_SERIOUS, TIER_COMMITTED } from "@/hooks/useSubscriptionTiers";

export function TierSwitch({ selectedTier, onSelectTier, accent }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 2 }}>
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(17,17,17,0.08)",
        }}
      >
        <TierUnderlineTab
          label="Serious"
          selected={selectedTier === TIER_SERIOUS}
          accent={accent}
          onPress={() => onSelectTier(TIER_SERIOUS)}
        />
        <TierUnderlineTab
          label="Committed"
          selected={selectedTier === TIER_COMMITTED}
          accent={accent}
          onPress={() => onSelectTier(TIER_COMMITTED)}
        />
      </View>
    </View>
  );
}
