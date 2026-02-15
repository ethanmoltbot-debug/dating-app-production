import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";

function Pill({ label, color, bg, border }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "900", color }}>{label}</Text>
    </View>
  );
}

export function DrinkOnUsSheet({
  sheetRef,
  perkState,
  hasDatePlan,
  onPlanDate,
  onRequestLocation,
  locationEnabled,
  onStartUnlock,
}) {
  const snapPoints = useMemo(() => ["62%"], []);

  const state = String(perkState || "LOCKED");

  const statePill =
    state === "REDEEMED"
      ? {
          label: "Used",
          color: "#374151",
          bg: "#F3F4F6",
          border: "#E5E7EB",
        }
      : state === "READY"
        ? {
            label: "Drink ready",
            color: "#9A3412",
            bg: "#FFEDD5",
            border: "#FED7AA",
          }
        : state === "ARMED"
          ? {
              label: "Ready when you meet",
              color: "#1E3A8A",
              bg: "#EEF2FF",
              border: "#C7D2FE",
            }
          : {
              label: "Locked",
              color: "#6B7280",
              bg: "#F9FAFB",
              border: "#E5E7EB",
            };

  const canStartUnlock = state === "READY";

  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"]; // pink -> purple

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#fff" }}
      handleIndicatorStyle={{ backgroundColor: "#D6D6D6" }}
    >
      <BottomSheetView style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 8,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
            Drink on Us
          </Text>
          <TouchableOpacity
            onPress={() => sheetRef.current?.close()}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#2D2D2D" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>

        <Pill {...statePill} />

        <Text style={{ marginTop: 12, fontSize: 14, color: "#2D2D2D" }}>
          When you two meet up, we’ll unlock a one-time drink credit you can use
          right then.
        </Text>

        <View style={{ marginTop: 12, gap: 8 }}>
          <Text style={{ fontSize: 13, color: "#2D2D2D" }}>
            • Unlocks when you’re together
          </Text>
          <Text style={{ fontSize: 13, color: "#2D2D2D" }}>
            • Takes ~10 seconds
          </Text>
          <Text style={{ fontSize: 13, color: "#2D2D2D" }}>
            • One-time use per date
          </Text>
        </View>

        {!hasDatePlan ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            <Text style={{ fontSize: 13, color: "#6B7280" }}>
              Plan a date for this match to arm the perk.
            </Text>

            <TouchableOpacity
              onPress={onPlanDate}
              activeOpacity={0.9}
              style={{ borderRadius: 12, overflow: "hidden" }}
            >
              <LinearGradient
                colors={CTA_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 12, alignItems: "center" }}
              >
                <Text
                  style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}
                >
                  Plan a date
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
              How it unlocks
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280" }}>
              We’ll arm this perk when a date is planned. When you’re both
              within about 50 meters for ~2 minutes (near the date time), it
              becomes ready.
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280" }}>
              Then you confirm together by entering a short code on both phones.
            </Text>

            {!locationEnabled ? (
              <TouchableOpacity
                onPress={onRequestLocation}
                style={{
                  backgroundColor: "#111",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}
                >
                  Enable location
                </Text>
              </TouchableOpacity>
            ) : null}

            {canStartUnlock ? (
              <TouchableOpacity
                onPress={onStartUnlock}
                activeOpacity={0.9}
                style={{ borderRadius: 12, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 12, alignItems: "center" }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}
                  >
                    Start unlock
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <View style={{ height: 24 }} />
      </BottomSheetView>
    </BottomSheet>
  );
}
