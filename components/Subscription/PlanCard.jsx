import { View, Text, Pressable } from "react-native";
import {
  packageTitle,
  packagePriceString,
} from "@/utils/subscriptionPackageHelpers";

export function PlanCard({
  pkg,
  selected,
  onPress,
  badge,
  subline,
  accent,
  containerStyle,
  // NEW
  titleText,
  priceText,
  disabled,
}) {
  const computedTitle = packageTitle(pkg);
  const computedPriceText = packagePriceString(pkg);

  const finalTitle = titleText || computedTitle;
  const finalPrice = priceText || computedPriceText;

  const isDisabled = !!disabled;

  const borderColor = selected ? accent : "#E5E5EA";
  const bg = selected ? "rgba(168, 85, 247, 0.08)" : "#FFFFFF";

  const disabledOpacity = isDisabled ? 0.55 : 1;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        backgroundColor: bg,
        padding: 12,
        opacity: disabledOpacity,
        ...containerStyle,
      }}
    >
      {/* Header: put the title on its own line so it never gets squeezed by the badge */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            color: "#111",
            fontWeight: "700",
            width: "100%",
          }}
        >
          {finalTitle}
        </Text>

        {badge ? (
          <View
            style={{
              backgroundColor: accent,
              paddingHorizontal: 9,
              paddingVertical: 3,
              borderRadius: 999,
              marginTop: 6,
            }}
          >
            <Text style={{ fontSize: 11, color: "#fff", fontWeight: "700" }}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={{
          fontSize: 22,
          color: "#111",
          fontWeight: "800",
          marginTop: 10,
        }}
      >
        {finalPrice || " "}
      </Text>

      {subline ? (
        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
          {subline}
        </Text>
      ) : (
        <View style={{ height: 16, marginTop: 6 }} />
      )}

      <View
        style={{
          marginTop: 10,
          height: 5,
          borderRadius: 999,
          backgroundColor: selected ? accent : "#E5E5EA",
          opacity: selected ? 0.95 : 1,
        }}
      />
    </Pressable>
  );
}
