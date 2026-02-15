import { useRef } from "react";
import {
  ScrollView,
  View,
  Animated,
  PanResponder,
  Keyboard,
  Platform,
} from "react-native";
import { useVoiceMemoPlayer } from "@/hooks/useVoiceMemoPlayer";
import { useMessageActions } from "@/hooks/useMessageActions";
import { MessageRenderer } from "./MessageRenderer";
import ReportMessageModal from "./ReportMessageModal";

export function MessageList({
  scrollViewRef,
  messages,
  userId,
  matchId,
  insets,
  topNode,
  inlineNode,
  inlineIndex,
  onOpenDateInvite,
  onReply,
  onToggleLike,
}) {
  const safeInlineIndex = Number.isFinite(Number(inlineIndex))
    ? Number(inlineIndex)
    : null;

  // NEW: harden against any non-array payloads (can happen if an API error returns a shape we don’t expect)
  const safeMessages = Array.isArray(messages) ? messages : [];

  const { playingMessageId, togglePlayVoiceMemo } = useVoiceMemoPlayer();

  const {
    reportOpen,
    reportType,
    setReportType,
    reportDesc,
    setReportDesc,
    reportSending,
    reportPreview,
    closeReport,
    submitMessageReport,
    openMessageActions,
    handleMaybeDoubleTapLike,
  } = useMessageActions({
    userId,
    matchId,
    onReply,
    onToggleLike,
  });

  const rendered = [];

  if (topNode) {
    rendered.push(
      <View key="__top__" style={{ marginBottom: 12 }}>
        {topNode}
      </View>,
    );
  }

  const swipeX = useRef(new Animated.Value(0)).current;
  const timestampWidth = 92;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_evt, gesture) => {
        const dx = Math.abs(gesture.dx);
        const dy = Math.abs(gesture.dy);
        // capture horizontal drags so vertical scrolling still works
        return dx > 10 && dx > dy;
      },
      onPanResponderMove: (_evt, gesture) => {
        const raw = gesture.dx;
        // only allow dragging left to reveal timestamps
        const clamped = Math.max(-timestampWidth, Math.min(0, raw));
        swipeX.setValue(clamped);
      },
      onPanResponderRelease: () => {
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 160,
          friction: 22,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 160,
          friction: 22,
        }).start();
      },
    }),
  ).current;

  safeMessages.forEach((message, idx) => {
    const shouldInsertHere =
      inlineNode && safeInlineIndex !== null && idx === safeInlineIndex;

    if (shouldInsertHere) {
      rendered.push(
        <View key="__inline__" style={{ marginBottom: 12 }}>
          {inlineNode}
        </View>,
      );
    }

    const messageKey = message?.id != null ? String(message.id) : `msg-${idx}`;

    rendered.push(
      <MessageRenderer
        key={messageKey}
        message={message}
        userId={userId}
        playingMessageId={playingMessageId}
        onOpenDateInvite={onOpenDateInvite}
        onToggleLike={onToggleLike}
        onTogglePlayVoiceMemo={togglePlayVoiceMemo}
        onOpenMessageActions={openMessageActions}
        onMaybeDoubleTapLike={handleMaybeDoubleTapLike}
        swipeX={swipeX}
      />,
    );
  });

  const shouldInsertAtEnd =
    inlineNode &&
    safeInlineIndex !== null &&
    (safeMessages.length === 0 || safeInlineIndex >= safeMessages.length);

  if (shouldInsertAtEnd) {
    rendered.push(
      <View key="__inline_end__" style={{ marginBottom: 12 }}>
        {inlineNode}
      </View>,
    );
  }

  return (
    <>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          onScrollBeginDrag={() => Keyboard.dismiss()}
          onTouchStart={() => Keyboard.dismiss()}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {rendered}
        </ScrollView>
      </View>

      <ReportMessageModal
        open={reportOpen}
        onClose={closeReport}
        messagePreview={reportPreview}
        reportType={reportType}
        setReportType={setReportType}
        reportDesc={reportDesc}
        setReportDesc={setReportDesc}
        sending={reportSending}
        onSubmit={submitMessageReport}
        insets={insets}
      />
    </>
  );
}
