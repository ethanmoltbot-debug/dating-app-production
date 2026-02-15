import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import AvailabilityModal from "./AvailabilityModal";
import { useMatchAvailability } from "@/hooks/useMatchAvailability";
import { DateInviteModal } from "./DateInviteModal";
// NEW: show what started the match/chat (like/comment on photo/prompt)
import { useConversationStarter } from "@/hooks/useConversationStarter";
import ConversationStarterCard from "./ConversationStarterCard";

function AvailabilitySavedNotice() {
  return (
    <View
      style={{
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        backgroundColor: "#fff",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color: "#2D2D2D" }}>
        Saved ✅ Wifey will suggest overlaps.
      </Text>
    </View>
  );
}

function safeDateMs(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

function StartChatHint({ otherName }) {
  const safeName =
    typeof otherName === "string" && otherName.trim().length > 0
      ? otherName.trim()
      : "your match";

  return (
    <View
      style={{
        alignSelf: "center",
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.75)",
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
      }}
    >
      <Text style={{ fontSize: 12, color: "#444", fontWeight: "900" }}>
        {`start the chat with ${safeName}`}
      </Text>
    </View>
  );
}

export function ChatTab({
  userId,
  matchId,
  messages,
  inputText,
  setInputText,
  sending,
  sendMessage,
  voiceSending,
  sendVoiceMemo,
  insets,
  reloadMessages,
  onRequestDateChange,
  drinkState,
  onPressDrink,
  otherName,
  // Pre-Chat / Active Chat consent prompt.
  // This should appear near the typing area (not on the Messages list rows).
  preChatBanner = null,
  // NEW: gate the composer (for Pre-Chats we show the CTA instead of the keyboard)
  canCompose = true,
  // NEW: message actions
  replyTo,
  onReplyToMessage,
  onCancelReply,
  onToggleLike,
}) {
  const queryClient = useQueryClient();
  const scrollViewRef = useRef(null);

  const [savedNoticeUntil, setSavedNoticeUntil] = useState(null);

  // NOTE: Date credit is now handled on the Messages tab (before entering chats).
  // We intentionally do not show any date-credit UI inside the chat.

  // NEW: date invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activeInvite, setActiveInvite] = useState(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  // NEW: modal state
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    // reset when switching matches
    hasAutoOpenedRef.current = false;
    setAvailabilityModalOpen(false);
  }, [matchId]);

  const counts = useMemo(() => {
    const uid = Number(userId);
    const safeMessages = Array.isArray(messages) ? messages : [];

    const myCount = safeMessages.filter(
      (m) => Number(m?.sender_id) === uid,
    ).length;
    const total = safeMessages.length;
    const otherCount = total - myCount;

    const meetsMessageTrigger = total >= 4 || (myCount >= 2 && otherCount >= 2);

    return { myCount, otherCount, total, meetsMessageTrigger };
  }, [messages, userId]);

  const showSavedNotice = useMemo(() => {
    if (!savedNoticeUntil) return false;
    return Date.now() < savedNoticeUntil;
  }, [savedNoticeUntil]);

  const onAvailabilitySaved = useCallback(() => {
    setSavedNoticeUntil(Date.now() + 30_000);
    setAvailabilityModalOpen(false);
  }, []);

  const onAvailabilitySkipped = useCallback(() => {
    setAvailabilityModalOpen(false);
  }, []);

  const triggerSource = counts.meetsMessageTrigger ? "messages" : null;

  const inlineIndex = useMemo(() => {
    const safeTotal = counts.total;
    if (safeTotal <= 1) return 0;
    return Math.max(0, safeTotal - 2);
  }, [counts.total]);

  const availabilityQuery = useMatchAvailability(matchId, userId);
  const availability = availabilityQuery.data?.availability || null;

  const nowMs = Date.now();
  const dismissedUntilMs = safeDateMs(availability?.dismissedUntil);
  const notSureUntilMs = safeDateMs(availability?.notSureUntil);

  const hasSavedNormalAvailability =
    availability &&
    !availability.tag &&
    Array.isArray(availability.days) &&
    availability.days.length > 0;

  const shouldSuppressForDismiss =
    typeof dismissedUntilMs === "number" && dismissedUntilMs > nowMs;

  const shouldSuppressForNotSure =
    availability?.tag === "not_sure" &&
    typeof notSureUntilMs === "number" &&
    notSureUntilMs > nowMs;

  const canShowPrompt =
    Boolean(triggerSource) &&
    availabilityQuery.isSuccess &&
    !hasSavedNormalAvailability &&
    !shouldSuppressForDismiss &&
    !shouldSuppressForNotSure;

  // NEW: automatically pop a modal ONLY for the message-count trigger
  useEffect(() => {
    if (!userId) return;
    if (!canShowPrompt) return;
    if (triggerSource !== "messages") return;
    if (availabilityModalOpen) return;
    if (hasAutoOpenedRef.current) return;

    hasAutoOpenedRef.current = true;
    setAvailabilityModalOpen(true);
  }, [availabilityModalOpen, canShowPrompt, triggerSource, userId]);

  const inlineNode = useMemo(() => {
    if (!userId) return null;
    if (!showSavedNotice) return null;
    return <AvailabilitySavedNotice />;
  }, [showSavedNotice, userId]);

  // NEW: conversation starter (last like that completed the match)
  const starterRes = useConversationStarter(matchId, userId);
  const starter = starterRes.starter;
  const starterReady = starterRes.starterQuery.isSuccess;

  const showDrinkBanner = String(drinkState || "").toUpperCase() === "READY";

  const onOpenDateInvite = useCallback((invite) => {
    setActiveInvite(invite);
    setInviteOpen(true);
  }, []);

  const inviteRole = useMemo(() => {
    const proposedBy = Number(activeInvite?.date?.proposedByUserId);
    const uid = Number(userId);
    if (
      Number.isFinite(proposedBy) &&
      Number.isFinite(uid) &&
      proposedBy === uid
    ) {
      return "creator";
    }
    return "recipient";
  }, [activeInvite?.date?.proposedByUserId, userId]);

  const respondToInvite = useCallback(
    async (response) => {
      if (!userId || !matchId) return;
      if (inviteBusy) return;

      setInviteBusy(true);
      try {
        const resp = await fetch(`/api/matches/${matchId}/date/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: Number(userId), response }),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(
            `When posting /api/matches/${matchId}/date/respond, the response was [${resp.status}] ${resp.statusText}. ${text}`,
          );
        }

        // Refresh date + chat
        queryClient.invalidateQueries({
          queryKey: ["matchDate", String(matchId), Number(userId)],
        });
        await reloadMessages?.();
        setInviteOpen(false);
        setActiveInvite(null);
      } catch (e) {
        console.error(e);
        Alert.alert("Could not update", "Please try again.");
      } finally {
        setInviteBusy(false);
      }
    },
    [inviteBusy, matchId, queryClient, reloadMessages, userId],
  );

  const cancelInvite = useCallback(async () => {
    if (!userId || !matchId) return;
    if (inviteBusy) return;

    setInviteBusy(true);
    try {
      const resp = await fetch(`/api/matches/${matchId}/date/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId) }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `When posting /api/matches/${matchId}/date/cancel, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["matchDate", String(matchId), Number(userId)],
      });
      // Keep Drink on Us UI in sync (cancel date -> LOCKED)
      queryClient.invalidateQueries({
        queryKey: ["drinkPerk", String(matchId), Number(userId)],
      });

      await reloadMessages?.();
      setInviteOpen(false);
      setActiveInvite(null);
    } catch (e) {
      console.error(e);
      Alert.alert("Could not cancel", "Please try again.");
    } finally {
      setInviteBusy(false);
    }
  }, [inviteBusy, matchId, queryClient, reloadMessages, userId]);

  const requestChange = useCallback(() => {
    setInviteOpen(false);
    setActiveInvite(null);
    onRequestDateChange?.();
  }, [onRequestDateChange]);

  const changeDetails = useCallback(() => {
    setInviteOpen(false);
    setActiveInvite(null);
    onRequestDateChange?.();
  }, [onRequestDateChange]);

  const topNode = useMemo(() => {
    const total = counts.total;
    const showStarter = starterReady && starter && total <= 6;
    const showHint = total === 0;

    if (!showStarter && !showHint) return null;

    return (
      <View>
        {showStarter ? (
          <ConversationStarterCard starter={starter} viewerUserId={userId} />
        ) : null}
        {showHint ? <StartChatHint otherName={otherName} /> : null}
      </View>
    );
  }, [counts.total, otherName, starter, starterReady, userId]);

  return (
    <>
      {showDrinkBanner ? (
        <TouchableOpacity
          onPress={onPressDrink}
          activeOpacity={0.85}
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 4,
            borderWidth: 1,
            borderColor: "#FED7AA",
            backgroundColor: "#FFEDD5",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "900", color: "#9A3412" }}>
            Drink ready — tap to start
          </Text>
          <Text style={{ fontSize: 12, color: "#9A3412", marginTop: 2 }}>
            You’re together. Confirm on both phones to unlock.
          </Text>
        </TouchableOpacity>
      ) : null}

      <MessageList
        scrollViewRef={scrollViewRef}
        messages={messages}
        userId={userId}
        matchId={matchId}
        insets={insets}
        topNode={topNode}
        inlineNode={inlineNode}
        inlineIndex={inlineIndex}
        onOpenDateInvite={onOpenDateInvite}
        onReply={onReplyToMessage}
        onToggleLike={onToggleLike}
      />

      {canCompose ? (
        <>
          {preChatBanner ? preChatBanner : null}

          <MessageInput
            insets={insets}
            inputText={inputText}
            setInputText={setInputText}
            sending={sending}
            sendMessage={sendMessage}
            voiceSending={voiceSending}
            sendVoiceMemo={sendVoiceMemo}
            replyTo={replyTo}
            onCancelReply={onCancelReply}
          />
        </>
      ) : (
        <View
          style={{
            paddingTop: 10,
            paddingBottom: insets.bottom + 10,
            paddingHorizontal: 14,
          }}
        >
          {preChatBanner ? (
            preChatBanner
          ) : (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.86)",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.06)",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontWeight: "900", color: "#111", fontSize: 13 }}>
                Loading…
              </Text>
            </View>
          )}
        </View>
      )}

      <AvailabilityModal
        open={
          availabilityModalOpen && canShowPrompt && triggerSource === "messages"
        }
        matchId={matchId}
        userId={userId}
        triggerSource={"messages"}
        onSaved={onAvailabilitySaved}
        onSkipped={onAvailabilitySkipped}
        insets={insets}
      />

      <DateInviteModal
        open={inviteOpen}
        invite={activeInvite}
        busy={inviteBusy}
        insets={insets}
        viewerRole={inviteRole}
        onClose={() => {
          setInviteOpen(false);
          setActiveInvite(null);
        }}
        onAccept={() => respondToInvite("accept")}
        onDecline={() => respondToInvite("decline")}
        onRequestChange={requestChange}
        onChange={changeDetails}
        onCancelInvite={cancelInvite}
      />
    </>
  );
}
