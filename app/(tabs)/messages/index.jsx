import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";

import { usePresencePing } from "@/hooks/usePresencePing";
import { useMessagesData } from "@/hooks/useMessagesData";
import DateFeedbackModal from "@/components/DateFeedbackModal";
import { useMessagesFeedback } from "@/hooks/useMessagesFeedback";
import { useMessagesTutorial } from "@/hooks/useMessagesTutorial";
import TutorialOverlay from "@/components/Tutorial/TutorialOverlay";

import { MessagesHeader } from "@/components/MessagesScreen/MessagesHeader";
import { BackgroundBlobs } from "@/components/MessagesScreen/BackgroundBlobs";
// DateCreditsGateModal intentionally not used: we gate Matches + Pre-Chats inline with a blur overlay.
import { useSubscription } from "@/utils/subscription";
import { useAuth } from "@/utils/auth/useAuth";
import { useMessagesNavigation } from "@/hooks/useMessagesNavigation";
import { useMessagesCredits } from "@/hooks/useMessagesCredits";
import { usePreChatDecisionTimers } from "@/hooks/usePreChatDecisionTimers";
import { useMessagesAutoRefresh } from "@/hooks/useMessagesAutoRefresh";

import { categorizeMatches } from "@/utils/messagesScreenHelpers";
import { MatchesSection } from "@/components/MessagesScreen/MatchesSection";
import { PreChatsSection } from "@/components/MessagesScreen/PreChatsSection";
import { ActiveChatsSection } from "@/components/MessagesScreen/ActiveChatsSection";
import { ChatsHiddenNotice } from "@/components/MessagesScreen/ChatsHiddenNotice";
import { HiddenSection } from "@/components/MessagesScreen/HiddenSection";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { tier, isCommitted } = useSubscription();
  const { auth } = useAuth();
  const jwt = auth?.jwt;

  const [hiddenExpanded, setHiddenExpanded] = useState(false);

  const {
    loading,
    matches,
    pendingMatchCount,
    user,
    error,
    loadMatches,
    markMatchesSeen,
  } = useMessagesData({ jwt });

  const { feedbackOpen, activeFeedback, handleFeedbackSubmitted } =
    useMessagesFeedback(user);

  const onFeedbackSubmitted = useCallback(
    async ({ matchId } = {}) => {
      await handleFeedbackSubmitted?.({ matchId });
      const uid = Number(user?.id);
      if (Number.isFinite(uid)) {
        await loadMatches(uid);
      }
    },
    [handleFeedbackSubmitted, loadMatches, user?.id],
  );

  const {
    tutorialStep,
    tutorial,
    tutorialPlacement,
    firstMatchRef,
    firstMatchRect,
    advanceTutorial,
  } = useMessagesTutorial(user, matches, insets);

  usePresencePing(user?.id, { enabled: Boolean(user?.id) });

  const BG_GRADIENT = useMemo(() => ["#F7EEFF", "#F2F7FF", "#FFF1F7"], []);

  const { creditStatus, refreshCredits, attemptRestoreCredits, restoreState } =
    useMessagesCredits({
      jwt,
      user,
      loadMatches,
    });

  const creditsCount = useMemo(() => {
    const c = Number(creditStatus?.credits || 0);
    return Number.isFinite(c) ? c : 0;
  }, [creditStatus?.credits]);

  const hasCredits = creditsCount > 0;

  // No credit nudge modal: we blur Matches + Pre-Chats instead.

  const openCreditsPurchase = useCallback(() => {
    try {
      const qs = new URLSearchParams();
      qs.set("returnTo", "/messages");
      router.push(`/date-credits?${qs.toString()}`);
    } catch (e) {
      console.error(e);
      router.push("/date-credits");
    }
  }, [router]);

  const onNeedCredits = useCallback(
    ({ matchId } = {}) => {
      try {
        const qs = new URLSearchParams();
        // If we were trying to start an active chat from a specific match,
        // return to that thread after purchase.
        const returnTo = matchId ? `/messages/${String(matchId)}` : "/messages";
        qs.set("returnTo", returnTo);
        router.push(`/date-credits?${qs.toString()}`);
      } catch (e) {
        console.error(e);
        router.push("/date-credits");
      }
    },
    [router],
  );

  const { openCommittedUpgrade, openThread, moveToChat } =
    useMessagesNavigation({ tier, user, loadMatches, onNeedCredits });

  const { matchRows, preChatRows, activeChatRows, archivedRows, closedRows } =
    useMemo(() => categorizeMatches(matches), [matches]);

  const activeLimit = isCommitted ? 3 : 1;
  const activeVisible = activeChatRows.slice(0, activeLimit);
  const otherChatsHidden =
    activeChatRows.length >= activeLimit && activeChatRows.length > 0;

  usePreChatDecisionTimers({
    user,
    preChatRows,
    loading,
    otherChatsHidden,
    loadMatches,
  });

  useMessagesAutoRefresh({
    user,
    closedRows,
    loadMatches,
    markMatchesSeen,
    refreshCredits,
    hasCredits,
    attemptRestoreCredits,
  });

  const showMatchesAndPreChatsGate = useMemo(() => {
    // Requirement: users need a date credit to view Matches and/or send Pre-Chats.
    // Hidden chats remain accessible without a date credit.
    return !hasCredits;
  }, [hasCredits]);

  const purchaseStateParam = useMemo(() => {
    const raw = params?.purchaseState;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const s = v != null ? String(v).trim().toLowerCase() : "";
    return s || null;
  }, [params?.purchaseState]);

  const showProcessingBanner = useMemo(() => {
    if (hasCredits) return false;
    if (restoreState?.restoring) return true;
    return purchaseStateParam === "processing";
  }, [hasCredits, purchaseStateParam, restoreState?.restoring]);

  const showProcessingErrorBanner = useMemo(() => {
    if (hasCredits) return false;
    if (restoreState?.restoring) return false;
    return Boolean(restoreState?.lastError);
  }, [hasCredits, restoreState?.lastError, restoreState?.restoring]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#FF1744" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <BackgroundBlobs />

      <MessagesHeader
        insets={insets}
        credits={creditStatus.credits}
        maxCredits={creditStatus.maxCredits}
        onPressCredits={openCreditsPurchase}
      />

      {showProcessingBanner ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <View
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.8)",
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.08)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
              Processing your purchase…
            </Text>
            <ActivityIndicator size="small" color="#7C3AED" />
          </View>
          <Text
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#6B7280",
              paddingHorizontal: 2,
            }}
          >
            This can take up to a minute. Matches will unlock automatically.
          </Text>
        </View>
      ) : null}

      {showProcessingErrorBanner ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <View
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.8)",
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.08)",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
              Purchase still processing
            </Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: "#6B7280" }}>
              If you just bought a credit, it can take a moment to show. Try
              closing and reopening the app.
            </Text>
          </View>
        </View>
      ) : null}

      {error ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <Text style={{ color: "#B00020", fontSize: 14 }}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {!otherChatsHidden ? (
          <View style={{ position: "relative" }}>
            <View pointerEvents={showMatchesAndPreChatsGate ? "none" : "auto"}>
              <MatchesSection
                matchRows={matchRows}
                pendingMatchCount={pendingMatchCount}
                onOpenThread={openThread}
              />

              <PreChatsSection
                preChatRows={preChatRows}
                closedRows={closedRows}
                onOpenThread={openThread}
                firstMatchRef={firstMatchRef}
              />
            </View>

            {showMatchesAndPreChatsGate ? (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={openCreditsPurchase}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 18,
                  overflow: "hidden",
                }}
              >
                <BlurView
                  intensity={35}
                  tint="light"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />

                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                    backgroundColor: "rgba(255,255,255,0.18)",
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: "rgba(255,255,255,0.84)",
                      borderWidth: 1,
                      borderColor: "rgba(17,17,17,0.08)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: "#111",
                        textAlign: "center",
                      }}
                    >
                      Add a date credit
                    </Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#6B7280",
                        textAlign: "center",
                        lineHeight: 16,
                      }}
                    >
                      Required to view matches and send pre-chats.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <ActiveChatsSection
          activeVisible={activeVisible}
          activeChatRows={activeChatRows}
          isCommitted={isCommitted}
          otherChatsHidden={otherChatsHidden}
          onOpenThread={openThread}
          onOpenCommittedUpgrade={openCommittedUpgrade}
        />

        {otherChatsHidden ? (
          <ChatsHiddenNotice
            isCommitted={isCommitted}
            onOpenCommittedUpgrade={openCommittedUpgrade}
          />
        ) : null}

        <HiddenSection
          archivedRows={archivedRows}
          hiddenExpanded={hiddenExpanded}
          onToggle={() => setHiddenExpanded((v) => !v)}
          onOpenThread={openThread}
        />
      </ScrollView>

      <DateFeedbackModal
        visible={feedbackOpen}
        insets={insets}
        matchId={activeFeedback?.matchId}
        otherName={activeFeedback?.otherUser?.displayName}
        userId={user?.id}
        onSubmitted={onFeedbackSubmitted}
      />

      {tutorial ? (
        <TutorialOverlay
          title={tutorial.title}
          body={tutorial.body}
          stepIndex={tutorialStep}
          totalSteps={1}
          placement={tutorialPlacement}
          targetRect={
            tutorial?.targetKey === "firstMatch" ? firstMatchRect : null
          }
          onPress={advanceTutorial}
        />
      ) : null}
    </View>
  );
}
