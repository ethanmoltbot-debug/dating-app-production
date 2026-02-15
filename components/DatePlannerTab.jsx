import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { openMaps } from "@/utils/openMaps";
import {
  formatLockedTitle,
  formatTimeRangeLine,
} from "@/utils/datePlannerHelpers";
import { useDatePlanner } from "@/hooks/useDatePlanner";
import { useMatchAvailability } from "@/hooks/useMatchAvailability";
import { AvailabilityPrompt } from "@/components/ConversationScreen/AvailabilityPrompt";
import { StatusPill } from "./DatePlannerTab/StatusPill";
import { DateHeader } from "./DatePlannerTab/DateHeader";
import { PrimaryButton } from "./DatePlannerTab/PrimaryButton";
import { SecondaryButton } from "./DatePlannerTab/SecondaryButton";
import { ProposedDateCard } from "./DatePlannerTab/ProposedDateCard";
import { WhenWhereCard } from "./DatePlannerTab/WhenWhereCard";
import { CalendarModal } from "./DatePlannerTab/CalendarModal";
import { ActionsModal } from "./DatePlannerTab/ActionsModal";
import { Card } from "./DatePlannerTab/Card";
import TimePickerModal from "@/components/TimePickerModal";
import PlaceSearchModal from "@/components/PlaceSearchModal";
import AvailabilityEditModal from "@/components/ConversationScreen/AvailabilityEditModal";

export default function DatePlannerTab({
  matchId,
  userId,
  otherName,
  editIntent,
}) {
  const scrollRef = useRef(null);
  const [whenWhereY, setWhenWhereY] = useState(0);
  const pendingScrollToWhenWhereRef = useRef(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [availabilityEditOpen, setAvailabilityEditOpen] = useState(false);

  const {
    dateQuery,
    dateModel,
    calendarOpen,
    setCalendarOpen,
    actionsOpen,
    setActionsOpen,
    showEditForm,
    setShowEditForm,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    activityLabel,
    setActivityLabel,
    placeLabel,
    setPlaceLabel,
    placeId,
    setPlaceId,
    placeSecondary,
    setPlaceSecondary,
    onPropose,
    confirmCancel,
    proposeMutation,
    respondMutation,
    proposeDisabled,
    busy,
    canQuery,
  } = useDatePlanner({ matchId, userId });

  const availabilityQuery = useMatchAvailability(matchId, userId);
  const availability = availabilityQuery.data?.availability || null;
  const otherAvailability = availabilityQuery.data?.otherAvailability || null;

  const overlapSummary = availabilityQuery.data?.overlap?.summary || null;
  const overlapDays = availabilityQuery.data?.overlap?.days || null;
  const overlapTimes = availabilityQuery.data?.overlap?.times || null;
  const hasOverlap = Boolean(overlapSummary);

  const myHasSavedNormalAvailability = useMemo(() => {
    if (!availability) return false;
    if (availability.tag) return false;
    const days = Array.isArray(availability.days) ? availability.days : [];
    return days.length > 0;
  }, [availability]);

  const otherHasSavedNormalAvailability = useMemo(() => {
    if (!otherAvailability) return false;
    if (otherAvailability.tag) return false;
    const days = Array.isArray(otherAvailability.days)
      ? otherAvailability.days
      : [];
    return days.length > 0;
  }, [otherAvailability]);

  const showWaitingOnOther =
    myHasSavedNormalAvailability && !otherHasSavedNormalAvailability;

  const status = String(dateModel?.dateStatus || "none");
  const proposedByMe =
    status === "proposed" &&
    Number(dateModel?.proposedByUserId) === Number(userId);

  const hasPlan = status !== "none" && status !== "expired";

  // keep the Date tab clean once a plan exists (unless chat explicitly asked to edit)
  useEffect(() => {
    if (!matchId) return;
    if (hasPlan && !editIntent) {
      setShowEditForm(false);
    }
  }, [editIntent, hasPlan, matchId, setShowEditForm]);

  // when switching matches, don’t carry over “edit mode” from the previous chat
  useEffect(() => {
    setShowEditForm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const lockedTitle = useMemo(() => {
    return formatLockedTitle(
      dateModel?.dateStart,
      dateModel?.dateEnd,
      dateModel?.activityLabel,
      dateModel?.placeLabel,
    );
  }, [
    dateModel?.activityLabel,
    dateModel?.dateEnd,
    dateModel?.dateStart,
    dateModel?.placeLabel,
  ]);

  const timeRangeLine = useMemo(() => {
    return formatTimeRangeLine(dateModel?.dateStart, dateModel?.dateEnd);
  }, [dateModel?.dateEnd, dateModel?.dateStart]);

  const titleLine = useMemo(() => {
    const name = otherName || "them";

    if (status === "proposed") {
      return proposedByMe ? `You invited ${name} to` : `${name} invited you to`;
    }

    if (status === "locked" || status === "ready") {
      return "Date locked";
    }

    if (status === "unlocked") {
      return "Unlocked 🍸";
    }

    return `Ready to date, ${name}?`;
  }, [otherName, proposedByMe, status]);

  const subLine = useMemo(() => {
    if (hasPlan) {
      return timeRangeLine || lockedTitle;
    }
    if (hasOverlap) {
      return `Overlap: ${overlapSummary}`;
    }
    return "Set availability in chat, then propose a time.";
  }, [hasOverlap, hasPlan, lockedTitle, overlapSummary, timeRangeLine]);

  const showError = !!dateQuery.error;

  const scrollToWhenWhere = useCallback(() => {
    pendingScrollToWhenWhereRef.current = true;

    if (!whenWhereY) {
      return;
    }

    pendingScrollToWhenWhereRef.current = false;
    scrollRef.current?.scrollTo({
      y: Math.max(0, whenWhereY - 10),
      animated: true,
    });
  }, [whenWhereY]);

  // when chat says “request change”, jump into the edit form
  useEffect(() => {
    if (!editIntent) return;
    setShowEditForm(true);
    scrollToWhenWhere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editIntent]);

  useEffect(() => {
    if (!pendingScrollToWhenWhereRef.current) {
      return;
    }
    if (!whenWhereY) {
      return;
    }

    pendingScrollToWhenWhereRef.current = false;
    scrollRef.current?.scrollTo({
      y: Math.max(0, whenWhereY - 10),
      animated: true,
    });
  }, [whenWhereY]);

  const openDirections = useCallback(async () => {
    const place = String(dateModel?.placeLabel || "").trim();
    const lat = dateModel?.placeLat;
    const lng = dateModel?.placeLng;
    if (
      !place &&
      !(Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)))
    ) {
      return;
    }

    await openMaps({ query: place, lat, lng });
  }, [dateModel?.placeLabel, dateModel?.placeLat, dateModel?.placeLng]);

  const onPickPlace = useCallback(
    ({ placeId: pid, label, secondary }) => {
      setPlaceId(pid || null);
      setPlaceLabel(label || "");
      setPlaceSecondary(secondary || "");
    },
    [setPlaceId, setPlaceLabel, setPlaceSecondary],
  );

  const onClearPlace = useCallback(() => {
    setPlaceId(null);
    setPlaceLabel("");
    setPlaceSecondary("");
  }, [setPlaceId, setPlaceLabel, setPlaceSecondary]);

  const onQuickPlace = useCallback(
    (label) => {
      setPlaceId(null);
      setPlaceSecondary("");
      setPlaceLabel(label);
    },
    [setPlaceId, setPlaceLabel, setPlaceSecondary],
  );

  const placeSuggestions = useMemo(
    () => [
      "Downtown",
      "South Congress",
      "East Austin",
      "Central Austin",
      "Domain",
    ],
    [],
  );

  const activitySuggestions = useMemo(
    () => ["Drinks", "Coffee", "Dinner", "Walk", "Live music"],
    [],
  );

  const showAcceptDecline = status === "proposed" && !proposedByMe;
  const showPropose = status === "none" || status === "expired";

  // When a date is set, only show the edit form *after* the user chooses to change it.
  const showWhenWhereCard = useMemo(() => {
    if (hasPlan) {
      return showEditForm;
    }
    return showPropose || showEditForm;
  }, [hasPlan, showEditForm, showPropose]);

  const showPlannedHeader =
    (status === "proposed" ||
      status === "locked" ||
      status === "ready" ||
      status === "unlocked") &&
    (!!dateModel?.placeLabel || !!dateModel?.activityLabel);

  const overlapCardText = useMemo(() => {
    if (!hasOverlap) return null;

    const dayPart =
      Array.isArray(overlapDays) && overlapDays.length
        ? overlapDays.join(" ")
        : null;

    const timePart =
      Array.isArray(overlapTimes) && overlapTimes.length
        ? overlapTimes.join(" / ")
        : null;

    if (dayPart && timePart) return `${dayPart} • ${timePart}`;
    return overlapSummary;
  }, [hasOverlap, overlapDays, overlapSummary, overlapTimes]);

  if (!canQuery) {
    return null;
  }

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: "#F5F5F5" }}
        contentContainerStyle={{ paddingBottom: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}
        >
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>
            {titleLine}
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
            {subLine}
          </Text>

          {status === "proposed" ? (
            <View style={{ marginTop: 10 }}>
              <StatusPill label="Pending" />
            </View>
          ) : null}
          {status === "locked" || status === "ready" ? (
            <View style={{ marginTop: 10 }}>
              <StatusPill label="Locked" />
            </View>
          ) : null}

          {showError ? (
            <Text style={{ fontSize: 12, color: "#B00020", marginTop: 10 }}>
              Could not load date plan.
            </Text>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {showPlannedHeader ? (
            <View style={{ gap: 10 }}>
              <DateHeader
                activityLabel={dateModel?.activityLabel}
                placeLabel={dateModel?.placeLabel}
                timeRangeLine={timeRangeLine}
                coverImageUrl={dateModel?.coverImageUrl}
                onOpenDirections={openDirections}
                placeRating={dateModel?.placeRating}
                placeRatingsTotal={dateModel?.placeRatingsTotal}
                placeAddress={dateModel?.placeAddress}
                placeDescription={dateModel?.placeDescription}
              />

              {proposedByMe || status === "locked" || status === "ready" ? (
                <View style={{ gap: 10 }}>
                  <PrimaryButton
                    label="Change / Cancel Date"
                    onPress={() => setActionsOpen(true)}
                    disabled={busy}
                  />
                  <SecondaryButton
                    label="Edit details"
                    onPress={() => {
                      scrollToWhenWhere();
                      setShowEditForm(true);
                    }}
                    disabled={busy}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {showAcceptDecline ? (
            <ProposedDateCard
              lockedTitle={lockedTitle}
              onAccept={() => respondMutation.mutate({ response: "accept" })}
              onDecline={() => respondMutation.mutate({ response: "decline" })}
              busy={busy}
            />
          ) : null}

          {/* If a date plan exists, keep the Date tab clean: show only the date card.
              Availability + overlap helpers are only shown when there is no plan. */}
          {!hasPlan ? (
            <>
              {!myHasSavedNormalAvailability ? (
                <AvailabilityPrompt
                  matchId={matchId}
                  userId={userId}
                  triggerSource="planDate"
                  showSkip={false}
                  showNotSure={false}
                  ignoreDismissCooldown={true}
                  onSaved={() => {
                    // react-query invalidation happens inside the prompt
                  }}
                />
              ) : (
                <Card>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "900",
                          color: "#111",
                        }}
                      >
                        Availability
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}
                      >
                        You’ve already shared yours. Want to update it?
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setAvailabilityEditOpen(true)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 999,
                        backgroundColor: "#111",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "900",
                          fontSize: 12,
                        }}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              {showWaitingOnOther ? (
                <Card>
                  <Text
                    style={{ fontSize: 14, fontWeight: "900", color: "#111" }}
                  >
                    Availability
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#6B7280", marginTop: 8 }}
                  >
                    You’ve shared yours. Waiting on them to add theirs.
                  </Text>
                </Card>
              ) : null}

              {hasOverlap ? (
                <Card>
                  <Text
                    style={{ fontSize: 14, fontWeight: "900", color: "#111" }}
                  >
                    Overlapping availability
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#6B7280", marginTop: 8 }}
                  >
                    {overlapCardText}
                  </Text>
                </Card>
              ) : null}
            </>
          ) : null}

          {/* NEW behavior: when a plan exists, do NOT show the “Current plan / Edit” block below.
              Only show the full edit form when the user explicitly chooses to change it. */}
          {showWhenWhereCard ? (
            <View
              onLayout={(e) => {
                setWhenWhereY(e.nativeEvent.layout.y);
              }}
            >
              <WhenWhereCard
                hasPlan={hasPlan}
                showEditForm={showEditForm}
                lockedTitle={lockedTitle}
                selectedDate={selectedDate}
                startTime={startTime}
                activityLabel={activityLabel}
                placeLabel={placeLabel}
                placeSecondary={placeSecondary}
                placeSuggestions={placeSuggestions}
                activitySuggestions={activitySuggestions}
                onOpenCalendar={() => setCalendarOpen(true)}
                onOpenTime={() => setTimeOpen(true)}
                onOpenPlaceSearch={() => setPlaceOpen(true)}
                onClearPlace={onClearPlace}
                onActivityLabelChange={setActivityLabel}
                onPlaceLabelChange={onQuickPlace}
                onPropose={() => {
                  onPropose();
                  setShowEditForm(false);
                }}
                onCancelEdit={() => setShowEditForm(false)}
                onEdit={() => {
                  scrollToWhenWhere();
                  setShowEditForm(true);
                }}
                isProposing={proposeMutation.isPending}
                proposeDisabled={proposeDisabled}
                busy={busy}
              />
            </View>
          ) : null}

          <View style={{ height: 10 }} />
        </View>
      </ScrollView>

      <CalendarModal
        visible={calendarOpen}
        selectedDate={selectedDate}
        onClose={() => setCalendarOpen(false)}
        onSelectDate={setSelectedDate}
      />

      <TimePickerModal
        visible={timeOpen}
        selectedTime={startTime}
        overlapTimes={overlapTimes}
        onClose={() => setTimeOpen(false)}
        onSelectTime={(t) => setStartTime(t)}
      />

      <ActionsModal
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
        onChangeDetails={() => {
          setActionsOpen(false);
          scrollToWhenWhere();
          setShowEditForm(true);
        }}
        onCancelDate={() => {
          setActionsOpen(false);
          confirmCancel();
        }}
        busy={busy}
      />

      <PlaceSearchModal
        visible={placeOpen}
        initialQuery={placeLabel}
        onClose={() => setPlaceOpen(false)}
        onSelectPlace={onPickPlace}
      />

      <AvailabilityEditModal
        visible={availabilityEditOpen}
        matchId={matchId}
        userId={userId}
        onClose={() => setAvailabilityEditOpen(false)}
        title="Update availability"
      />
    </KeyboardAvoidingAnimatedView>
  );
}
