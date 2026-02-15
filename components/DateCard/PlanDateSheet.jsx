import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Calendar } from "react-native-calendars";
import { AvailabilityPrompt } from "@/components/ConversationScreen/AvailabilityPrompt";
import {
  buildDateTimeIso,
  addMinutesToIso,
  DEFAULT_DATE_DURATION_MINUTES,
} from "@/utils/dateCardHelpers";

export function PlanDateSheet({
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
  busy,
}) {
  const overlapLine = overlapSummary
    ? `You're both free: ${overlapSummary}`
    : null;

  const shouldShowWaitingOnOther =
    !overlapSummary &&
    myHasSavedNormalAvailability &&
    !otherHasSavedNormalAvailability;

  const shouldOfferAvailability =
    !overlapSummary && !myHasSavedNormalAvailability;

  return (
    <View style={{ gap: 12 }}>
      {overlapLine ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E5E5",
            borderRadius: 14,
            padding: 12,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 12, color: "#2D2D2D", fontWeight: "800" }}>
            {overlapLine}
          </Text>
        </View>
      ) : null}

      {shouldOfferAvailability ? (
        <AvailabilityPrompt
          matchId={matchId}
          userId={userId}
          triggerSource="planDate"
          showSkip={false}
          showNotSure={false}
          ignoreDismissCooldown={true}
          onSaved={() => {}}
        />
      ) : null}

      {shouldShowWaitingOnOther ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E5E5",
            borderRadius: 14,
            padding: 12,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "900", color: "#111" }}>
            Waiting on them
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
            You've shared your availability. They haven't set theirs yet.
          </Text>
        </View>
      ) : null}

      <Calendar
        onDayPress={(day) => setSelectedDate(day?.dateString)}
        markedDates={
          selectedDate
            ? {
                [selectedDate]: {
                  selected: true,
                  selectedColor: "#FF1744",
                },
              }
            : {}
        }
        enableSwipeMonths
        theme={{
          todayTextColor: "#FF1744",
          arrowColor: "#2D2D2D",
        }}
      />

      <TouchableOpacity
        onPress={() => setTimeOpen(true)}
        activeOpacity={0.85}
        style={{
          borderWidth: 1,
          borderColor: "#E5E5E5",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 12, color: "#777", fontWeight: "700" }}>
          Start time
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontSize: 14,
            fontWeight: "800",
            color: "#2D2D2D",
          }}
        >
          {startTime ? String(startTime) : "Pick a time"}
        </Text>
      </TouchableOpacity>

      <View>
        <Text style={{ fontSize: 12, color: "#777", fontWeight: "700" }}>
          Activity
        </Text>
        <BottomSheetTextInput
          value={activityLabel}
          onChangeText={setActivityLabel}
          placeholder="Drinks"
          placeholderTextColor="#999"
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: "#2D2D2D",
            backgroundColor: "#fff",
          }}
        />
      </View>

      <View>
        <Text style={{ fontSize: 12, color: "#777", fontWeight: "700" }}>
          Location
        </Text>

        <TouchableOpacity
          onPress={() => setPlaceOpen(true)}
          activeOpacity={0.85}
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: "#fff",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: placeLabel ? "#2D2D2D" : "#999",
              }}
              numberOfLines={1}
            >
              {placeLabel ? String(placeLabel) : "Search a place"}
            </Text>
            {placeSecondary ? (
              <Text
                style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}
                numberOfLines={1}
              >
                {String(placeSecondary)}
              </Text>
            ) : null}
          </View>

          {placeLabel ? (
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                onClearPlace();
              }}
              style={{ paddingHorizontal: 6, paddingVertical: 6 }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  color: "#6B7280",
                }}
              >
                Clear
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: "#FF1744",
              }}
            >
              Search
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
          }}
        >
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => onQuickPlace(s)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                backgroundColor: "#fff",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#2D2D2D",
                  fontWeight: "700",
                }}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={onSubmitPropose}
        disabled={busy}
        style={{
          marginTop: 6,
          backgroundColor: "#FF1744",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>
            Propose Date
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
