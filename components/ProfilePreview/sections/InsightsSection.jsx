import { View, Text, ActivityIndicator } from "react-native";
import { Card } from "../Card";
import { SectionHeader } from "../SectionHeader";
import { THEME, ACCENT } from "../theme";

export function InsightsSection({
  shouldFetchInsights,
  insightsQuery,
  dateHistoryLine,
  followThroughLine,
}) {
  const showLoading = shouldFetchInsights && insightsQuery.isLoading;
  const showError = shouldFetchInsights && insightsQuery.isError;

  const dateHistoryValue = showError
    ? "Unavailable"
    : dateHistoryLine || "0 dates on Wifey";

  const followThroughValue = showError
    ? "Unavailable"
    : followThroughLine || "Not enough data yet";

  return (
    <Card style={{ padding: 16 }}>
      <SectionHeader title="Dating insights" />

      <View style={{ marginTop: 12, gap: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text style={{ color: THEME.muted, fontWeight: "900" }}>
            Date history
          </Text>
          <Text style={{ color: THEME.text, fontWeight: "900" }}>
            {dateHistoryValue}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "rgba(17,24,39,0.06)",
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text style={{ color: THEME.muted, fontWeight: "900" }}>
            Follow-through
          </Text>
          <Text style={{ color: THEME.text, fontWeight: "900" }}>
            {followThroughValue}
          </Text>
        </View>

        {showLoading ? (
          <View style={{ marginTop: 2, alignItems: "flex-start" }}>
            <ActivityIndicator size="small" color={ACCENT} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
