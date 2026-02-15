import { View, Text, ActivityIndicator } from "react-native";
import { PlanCard } from "./PlanCard";
import {
  packageTitle,
  computeSavingsBadge,
  formatWeeklyEquivalent,
  formatUsd,
  packageIdentifier,
  packagePriceString,
  packagePriceNumber,
} from "@/utils/subscriptionPackageHelpers";

export function PlansSection({
  loadingPlans,
  plans,
  selectedIdentifier,
  onSelectPackage,
  weeklyPkg,
  accent,
  selectedTier,
}) {
  if (loadingPlans) {
    return (
      <View style={{ paddingTop: 18, paddingHorizontal: 16 }}>
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#E5E5EA",
            backgroundColor: "#fff",
            padding: 16,
            alignItems: "center",
            justifyContent: "center",
            height: 110,
          }}
        >
          <ActivityIndicator size="small" color={accent} />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>Loading…</Text>
        </View>
      </View>
    );
  }

  const safePlans = Array.isArray(plans) ? plans : [];

  if (safePlans.length === 0) {
    return (
      <View style={{ paddingTop: 18, paddingHorizontal: 16 }}>
        <View style={{ paddingTop: 10 }}>
          <Text style={{ color: "#6B7280", textAlign: "center" }}>
            No plans found for this tier. In RevenueCat, add packages for 1
            week, 1 month, and 3 months.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingTop: 18, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row" }}>
        {safePlans.map((plan, idx) => {
          const pkg = plan?.pkg || null;
          const planKey = plan?.planKey || null;
          const id = packageIdentifier(pkg);

          const selected = id && id === selectedIdentifier;
          const marginRight = idx === safePlans.length - 1 ? 0 : 10;

          const disabled = !id;

          let badge = null;
          let subline = null;
          let titleText = null;
          let priceText = null;

          // Stable naming when we know the plan key.
          if (planKey === "weekly") titleText = "1 week";
          if (planKey === "monthly") titleText = "1 month";
          if (planKey === "three_month") titleText = "3 months";

          // Always prefer the real localized price from RevenueCat.
          const rcPrice = pkg ? packagePriceString(pkg) : "";
          if (rcPrice) {
            priceText = rcPrice;
          } else if (pkg) {
            const n = packagePriceNumber(pkg);
            priceText = Number.isFinite(n) ? formatUsd(n) : "—";
          } else {
            priceText = "—";
          }

          if (pkg) {
            // Only show savings on non-weekly plans.
            badge =
              planKey && planKey === "weekly"
                ? null
                : computeSavingsBadge(pkg, weeklyPkg);

            const perWeek = formatWeeklyEquivalent(pkg);
            const computedTitle = packageTitle(pkg);
            const computedSubline =
              perWeek && computedTitle !== "1 week" ? perWeek : null;
            subline = computedSubline;
          }

          const finalSubline =
            subline || (disabled ? "Add this package in RevenueCat" : null);

          const handlePress = () => {
            if (!id) return;
            onSelectPackage(id);
          };

          return (
            <PlanCard
              key={String(id || `${planKey || "plan"}-${idx}`)}
              pkg={pkg}
              selected={!!selected}
              badge={badge}
              subline={finalSubline}
              accent={accent}
              containerStyle={{ marginRight }}
              onPress={handlePress}
              titleText={titleText}
              priceText={priceText}
              disabled={disabled}
            />
          );
        })}
      </View>

      <View style={{ paddingTop: 12 }}>
        <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
          You can cancel anytime in your App Store settings.
        </Text>
      </View>
    </View>
  );
}
