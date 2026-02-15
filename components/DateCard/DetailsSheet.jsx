import { View, Text, TouchableOpacity } from "react-native";
import { buildLockedTitle } from "@/utils/dateCardHelpers";

export function DetailsSheet({
  dateModel,
  inWindow,
  hasLocationPermission,
  requestLocationPermission,
}) {
  const detailsLine = buildLockedTitle(
    dateModel?.dateStart,
    dateModel?.dateEnd,
    dateModel?.activityLabel,
    dateModel?.placeLabel,
  );

  const creditDollars = (
    Number(dateModel?.creditAmountCents || 0) / 100
  ).toFixed(0);

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E5E5",
          borderRadius: 14,
          padding: 12,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#2D2D2D" }}>
          {detailsLine}
        </Text>
        <Text style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
          Have a drink on Wifey: ${creditDollars} credit unlocks when you both
          meet.
        </Text>
      </View>

      {inWindow && !hasLocationPermission ? (
        <TouchableOpacity
          onPress={requestLocationPermission}
          style={{
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#2D2D2D" }}>
            Enable location to unlock
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
