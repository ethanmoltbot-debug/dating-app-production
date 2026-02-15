import { useMemo, useCallback } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import DatePlannerTab from "@/components/DatePlannerTab";
import { useConversation } from "@/hooks/useConversation";
import { useMatchActions } from "@/hooks/useMatchActions";
import { useReportUser } from "@/hooks/useReportUser";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useDrinkPerk } from "@/hooks/useDrinkPerk";
import { usePresencePing } from "@/hooks/usePresencePing";
import { ConversationHeader } from "@/components/ConversationScreen/ConversationHeader";
import { TabNavigation } from "@/components/ConversationScreen/TabNavigation";
import { ChatTab } from "@/components/ConversationScreen/ChatTab";
import { ProfileTab } from "@/components/ConversationScreen/ProfileTab";
import { MenuModal } from "@/components/ConversationScreen/MenuModal";
import { ReportModal } from "@/components/ConversationScreen/ReportModal";
import { UnmatchReasonModal } from "@/components/ConversationScreen/UnmatchReasonModal";
import { DrinkOnUsSheet } from "@/components/ConversationScreen/DrinkOnUsSheet";
import { DrinkUnlockModal } from "@/components/ConversationScreen/DrinkUnlockModal";
import { ChatCreditModal } from "@/components/ConversationScreen/ChatCreditModal";
import { PreChatBanner } from "@/components/ConversationScreen/PreChatBanner";
import { LoadingState } from "@/components/ConversationScreen/LoadingState";
import { ErrorState } from "@/components/ConversationScreen/ErrorState";
import { BackgroundGradient } from "@/components/ConversationScreen/BackgroundGradient";
import { useSubscription } from "@/utils/subscription";
import {
  getHeaderAvatarUri,
  getHeaderInitial,
} from "@/utils/conversationHelpers";
import {
  parseMatchIdFromParams,
  parseStartTabFromParams,
  parseOpenDrinkIntentFromParams,
} from "@/utils/conversationScreenHelpers";
import { useConversationScreen } from "@/hooks/useConversationScreen";
import { useConversationNavigation } from "@/hooks/useConversationNavigation";
import { useDrinkPerkAutoOpen } from "@/hooks/useDrinkPerkAutoOpen";
import { useUnmatchHandler } from "@/hooks/useUnmatchHandler";

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const { tier } = useSubscription();

  const matchId = useMemo(() => parseMatchIdFromParams(params), [params]);
  const startTab = useMemo(() => parseStartTabFromParams(params), [params]);
  const openDrinkIntent = useMemo(
    () => parseOpenDrinkIntentFromParams(params),
    [params],
  );

  useConversationNavigation(navigation, router);

  const {
    loading,
    error,
    messages,
    setMessages,
    user,
    matchInfo,
    reloadMessages,
  } = useConversation(matchId);

  const realMessageCount = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    return list.length;
  }, [messages]);

  usePresencePing(user?.id, { enabled: Boolean(user?.id) });

  const {
    perkState,
    hasDatePlan,
    pingLocationMutation,
    refetchAll: refetchDrink,
  } = useDrinkPerk(matchId, user?.id);

  const {
    activeTab,
    setActiveTab,
    menuOpen,
    setMenuOpen,
    unmatchOpen,
    setUnmatchOpen,
    dateEditIntent,
    creditModalOpen,
    setCreditModalOpen,
    preChatPromptDismissed,
    setPreChatPromptDismissed,
    creditModalIntent,
    setCreditModalIntent,
    pendingMoveAfterCommitRef,
    consentStatus,
    setConsentStatus,
    consentLoading,
    moveBusy,
    drinkSheetRef,
    unlockOpen,
    setUnlockOpen,
    locationEnabled,
    autoOpenedDrinkRef,
    toggleLike,
    requestDateChange,
    openDrinkSheet,
    requestDrinkLocation,
    planDateFromDrink,
    startUnlock,
    onUnlocked,
    handleMoveToChat: handleMoveToChatBase,
  } = useConversationScreen({
    matchId,
    user,
    matchInfo,
    tier,
    perkState,
    reloadMessages,
    refetchDrink,
    pingLocationMutation,
    setMessages,
  });

  useDrinkPerkAutoOpen({
    matchId,
    openDrinkIntent,
    perkState,
    autoOpenedDrinkRef,
    setUnlockOpen,
  });

  const { handleCall, weMet, unmatch, blockUser } = useMatchActions(
    matchId,
    matchInfo,
    user,
    router,
  );

  const otherNameForUnmatch = matchInfo?.otherUser?.displayName || "them";

  const { onPickUnmatchReason } = useUnmatchHandler(unmatch, setUnmatchOpen);

  const {
    reportOpen,
    setReportOpen,
    reportType,
    setReportType,
    reportDesc,
    setReportDesc,
    reportSending,
    submitReport,
  } = useReportUser(matchInfo, user);

  const {
    inputText,
    setInputText,
    sending,
    sendMessage,
    voiceSending,
    sendVoiceMemo,
    replyTo,
    setReplyTo,
    clearReplyTo,
  } = useSendMessage(matchId, user, setMessages, {
    onPaymentRequired: () => {
      setCreditModalIntent("send");
      setCreditModalOpen(true);
    },
  });

  const handleMoveToChat = useCallback(() => {
    handleMoveToChatBase(router);
  }, [handleMoveToChatBase, router]);

  const closeCreditModal = useCallback(() => {
    setCreditModalOpen(false);
    setCreditModalIntent(null);
    pendingMoveAfterCommitRef.current = false;
  }, [setCreditModalIntent, setCreditModalOpen, pendingMoveAfterCommitRef]);

  const openOtherProfile = useCallback(() => {
    const otherUserId = matchInfo?.otherUser?.id;
    if (!otherUserId) {
      return;
    }
    router.push(`/profile/${otherUserId}`);
  }, [matchInfo?.otherUser?.id, router]);

  const canCompose = useMemo(() => {
    const terminal = consentStatus?.terminalState;
    if (terminal) {
      return false;
    }

    // NEW POLICY: users can send messages in Matches + Pre-Chats without credits.
    // Active chats may still prompt for a date credit (server-enforced).
    return true;
  }, [consentStatus?.terminalState]);

  const preChatBanner = useMemo(
    () => (
      <PreChatBanner
        realMessageCount={realMessageCount}
        matchId={matchId}
        userId={user?.id}
        preChatPromptDismissed={preChatPromptDismissed}
        consentStatus={consentStatus}
        consentLoading={consentLoading}
        handleMoveToChat={handleMoveToChat}
        moveBusy={moveBusy}
        setPreChatPromptDismissed={setPreChatPromptDismissed}
      />
    ),
    [
      realMessageCount,
      matchId,
      user?.id,
      preChatPromptDismissed,
      consentStatus,
      consentLoading,
      handleMoveToChat,
      moveBusy,
      setPreChatPromptDismissed,
    ],
  );

  if (!matchId) {
    return <LoadingState message="Opening chat…" />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        insets={insets}
        onGoBack={() => {
          try {
            router.replace("/messages");
          } catch (e) {
            console.error(e);
          }
        }}
      />
    );
  }

  const headerTitle = matchInfo?.otherUser?.displayName || "Chat";
  const headerAvatarUri = getHeaderAvatarUri(matchInfo);
  const headerInitial = getHeaderInitial(headerTitle);
  const statusBarStyle = activeTab === "profile" ? "light" : "dark";
  const showChat = activeTab === "chat";
  const showDate = activeTab === "date";
  const showProfile = activeTab === "profile";

  const otherIsOnline = Boolean(matchInfo?.otherUser?.isOnline);
  const otherLastSeenAt = matchInfo?.otherUser?.lastSeenAt || null;

  return (
    <View
      style={{ flex: 1, backgroundColor: showProfile ? "#0B0B10" : "#fff" }}
    >
      <BackgroundGradient showProfile={showProfile} />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "transparent" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <StatusBar style={statusBarStyle} />

        <ConversationHeader
          insets={insets}
          router={router}
          headerTitle={headerTitle}
          headerAvatarUri={headerAvatarUri}
          headerInitial={headerInitial}
          openOtherProfile={openOtherProfile}
          handleCall={handleCall}
          setMenuOpen={setMenuOpen}
          drinkState={perkState}
          onPressDrink={openDrinkSheet}
          otherIsOnline={otherIsOnline}
          otherLastSeenAt={otherLastSeenAt}
        />

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {showChat ? (
          <ChatTab
            userId={user?.id}
            matchId={matchId}
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            sending={sending}
            sendMessage={sendMessage}
            voiceSending={voiceSending}
            sendVoiceMemo={sendVoiceMemo}
            insets={insets}
            reloadMessages={reloadMessages}
            onRequestDateChange={requestDateChange}
            drinkState={perkState}
            onPressDrink={startUnlock}
            otherName={headerTitle}
            preChatBanner={preChatBanner}
            canCompose={canCompose}
            replyTo={replyTo}
            onReplyToMessage={setReplyTo}
            onCancelReply={clearReplyTo}
            onToggleLike={toggleLike}
          />
        ) : null}

        {showDate ? (
          <DatePlannerTab
            matchId={matchId}
            userId={user?.id}
            otherName={headerTitle}
            editIntent={dateEditIntent}
          />
        ) : null}

        {showProfile ? (
          <ProfileTab matchInfo={matchInfo} insets={insets} />
        ) : null}

        <MenuModal
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          setReportOpen={setReportOpen}
          weMet={weMet}
          onPressUnmatch={() => setUnmatchOpen(true)}
          blockUser={blockUser}
          insets={insets}
        />

        <UnmatchReasonModal
          visible={unmatchOpen}
          onClose={() => setUnmatchOpen(false)}
          onPickReason={onPickUnmatchReason}
          insets={insets}
          otherName={otherNameForUnmatch}
        />

        <ReportModal
          reportOpen={reportOpen}
          setReportOpen={setReportOpen}
          reportType={reportType}
          setReportType={setReportType}
          reportDesc={reportDesc}
          setReportDesc={setReportDesc}
          reportSending={reportSending}
          submitReport={submitReport}
          insets={insets}
        />

        <DrinkOnUsSheet
          sheetRef={drinkSheetRef}
          perkState={perkState}
          hasDatePlan={hasDatePlan}
          onPlanDate={planDateFromDrink}
          onRequestLocation={requestDrinkLocation}
          locationEnabled={locationEnabled}
          onStartUnlock={startUnlock}
        />

        <DrinkUnlockModal
          visible={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          matchId={matchId}
          userId={user?.id}
          onUnlocked={onUnlocked}
        />

        <ChatCreditModal
          visible={creditModalOpen}
          matchId={matchId}
          userId={user?.id}
          required={creditModalIntent === "move"}
          intent={creditModalIntent || "move"}
          onClose={closeCreditModal}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
