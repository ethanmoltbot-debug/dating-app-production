import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { PlanDateSheet } from "./PlanDateSheet";
import { ReviewDateSheet } from "./ReviewDateSheet";
import { DetailsSheet } from "./DetailsSheet";
import { CreditSheet } from "./CreditSheet";

export function DateCardBottomSheet({
  sheetRef,
  sheetMode,
  dateModel,
  matchId,
  userId,
  overlapSummary,
  myHasSavedNormalAvailability,
  otherHasSavedNormalAvailability,
  selectedDate,
  setSelectedDate,
  startTime,
  setTimeOpen,
  activityLabel,
  setActivityLabel,
  placeLabel,
  placeSecondary,
  setPlaceOpen,
  onClearPlace,
  suggestions,
  onQuickPlace,
  onSubmitPropose,
  proposeMutation,
  respondMutation,
  computed,
  hasLocationPermission,
  requestLocationPermission,
}) {
  const snapPoints = useMemo(() => ["80%"], []);

  const busy = proposeMutation.isPending || respondMutation.isPending;

  const header =
    sheetMode === "plan"
      ? "Plan a Date"
      : sheetMode === "review"
        ? "Date Proposal"
        : sheetMode === "credit"
          ? "Credit"
          : "Date Details";

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
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#2D2D2D" }}>
            {header}
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

        {sheetMode === "plan" ? (
          <PlanDateSheet
            matchId={matchId}
            userId={userId}
            overlapSummary={overlapSummary}
            myHasSavedNormalAvailability={myHasSavedNormalAvailability}
            otherHasSavedNormalAvailability={otherHasSavedNormalAvailability}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            startTime={startTime}
            setTimeOpen={setTimeOpen}
            activityLabel={activityLabel}
            setActivityLabel={setActivityLabel}
            placeLabel={placeLabel}
            placeSecondary={placeSecondary}
            setPlaceOpen={setPlaceOpen}
            onClearPlace={onClearPlace}
            suggestions={suggestions}
            onQuickPlace={onQuickPlace}
            onSubmitPropose={onSubmitPropose}
            busy={busy}
          />
        ) : null}

        {sheetMode === "review" ? (
          <ReviewDateSheet
            dateModel={dateModel}
            proposedByMe={computed.proposedByMe}
            respondMutation={respondMutation}
            busy={busy}
          />
        ) : null}

        {sheetMode === "details" ? (
          <DetailsSheet
            dateModel={dateModel}
            inWindow={computed.inWindow}
            hasLocationPermission={hasLocationPermission}
            requestLocationPermission={requestLocationPermission}
          />
        ) : null}

        {sheetMode === "credit" ? <CreditSheet dateModel={dateModel} /> : null}

        <View style={{ height: 24 }} />
      </BottomSheetView>
    </BottomSheet>
  );
}
