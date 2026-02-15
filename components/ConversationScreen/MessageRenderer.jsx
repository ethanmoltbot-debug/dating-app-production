import { View } from "react-native";
import { DateInviteBubble } from "./MessageBubbles/DateInviteBubble";
import { LikePill } from "./MessageBubbles/LikePill";
import { VoiceMemoBubble } from "./MessageBubbles/VoiceMemoBubble";
import { TextBubble } from "./MessageBubbles/TextBubble";
import { MessageLikeButton } from "./MessageBubbles/MessageLikeButton";
import { SwipeTimestampRow } from "./MessageBubbles/SwipeTimestampRow";
import { SystemMessage } from "./MessageBubbles/SystemMessage";
import {
  getDateInvite,
  getReplyPreview,
  formatTime,
} from "@/utils/messageHelpers";

export function MessageRenderer({
  message,
  userId,
  playingMessageId,
  onOpenDateInvite,
  onToggleLike,
  onTogglePlayVoiceMemo,
  onOpenMessageActions,
  onMaybeDoubleTapLike,
  swipeX,
}) {
  const isSystem = message.sender_id == null;

  if (isSystem) {
    const sysType = String(message?.message_type || "").toUpperCase();
    const sysText = String(message?.message_text || "").toLowerCase();
    const looksLikeOldCreditNag =
      sysText.includes("date credit") ||
      sysText.includes("$30") ||
      sysText.includes("start with intent") ||
      sysText.includes("commit") ||
      sysText.includes("unlock") ||
      sysText.includes("won't see") ||
      sysText.includes("won't see");

    const shouldHide =
      sysType === "CHAT_CREDIT_REQUIRED" || looksLikeOldCreditNag;
    if (shouldHide) {
      return null;
    }

    return <SystemMessage message={message} />;
  }

  const invite = getDateInvite(message);
  if (invite) {
    const isMeInvite = Number(message.sender_id) === Number(userId);
    const longPressHandler = () => onOpenMessageActions(message);
    const timeLabel = formatTime(message.created_at);

    const main = (
      <View>
        <DateInviteBubble
          invite={invite}
          isMe={isMeInvite}
          onPress={() => onOpenDateInvite?.(invite)}
          onLongPress={longPressHandler}
        />
        <LikePill
          message={message}
          isMe={isMeInvite}
          onToggleLike={onToggleLike}
        />
      </View>
    );

    return (
      <View style={{ width: "100%" }}>
        <SwipeTimestampRow
          main={main}
          timestampLabel={timeLabel}
          swipeX={swipeX}
        />
      </View>
    );
  }

  const isVoiceMemo =
    String(message?.message_type || "").toUpperCase() === "AUDIO" ||
    Boolean(message?.audio_url);

  const isMe = message.sender_id === userId;
  const replyPreview = getReplyPreview(message);

  if (isVoiceMemo) {
    const timeLabel = formatTime(message.created_at);
    const isPlaying = Boolean(
      playingMessageId && playingMessageId === message.id,
    );

    if (isMe) {
      const main = (
        <View style={{ alignSelf: "flex-end" }}>
          <VoiceMemoBubble
            message={message}
            isMe={true}
            isPlaying={isPlaying}
            replyPreview={replyPreview}
            onPress={() => onTogglePlayVoiceMemo(message)}
            onLongPress={() => onOpenMessageActions(message)}
          />
        </View>
      );

      return (
        <View style={{ width: "100%" }}>
          <SwipeTimestampRow
            main={main}
            timestampLabel={timeLabel}
            swipeX={swipeX}
          />
        </View>
      );
    }

    const main = (
      <View style={{ alignSelf: "flex-start", width: "100%" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center", // Tinder-style: hearts are vertically centered
            width: "100%",
            paddingRight: 2,
          }}
        >
          <VoiceMemoBubble
            message={message}
            isMe={false}
            isPlaying={isPlaying}
            replyPreview={replyPreview}
            onPress={() => onTogglePlayVoiceMemo(message)}
            onLongPress={() => onOpenMessageActions(message)}
          />

          <MessageLikeButton message={message} onToggleLike={onToggleLike} />
        </View>
      </View>
    );

    return (
      <View style={{ width: "100%" }}>
        <SwipeTimestampRow
          main={main}
          timestampLabel={timeLabel}
          swipeX={swipeX}
        />
      </View>
    );
  }

  // TEXT messages
  const timeLabel = formatTime(message.created_at);

  if (isMe) {
    const main = (
      <View style={{ alignSelf: "flex-end" }}>
        <TextBubble
          message={message}
          isMe={true}
          replyPreview={replyPreview}
          onPress={() => onMaybeDoubleTapLike(message)}
          onLongPress={() => onOpenMessageActions(message)}
        />
      </View>
    );

    return (
      <View style={{ width: "100%" }}>
        <SwipeTimestampRow
          main={main}
          timestampLabel={timeLabel}
          swipeX={swipeX}
        />
      </View>
    );
  }

  const main = (
    <View style={{ alignSelf: "flex-start", width: "100%" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center", // Tinder-style: hearts are vertically centered
          width: "100%",
          paddingRight: 2,
        }}
      >
        <TextBubble
          message={message}
          isMe={false}
          replyPreview={replyPreview}
          onPress={() => onMaybeDoubleTapLike(message)}
          onLongPress={() => onOpenMessageActions(message)}
        />

        <MessageLikeButton message={message} onToggleLike={onToggleLike} />
      </View>
    </View>
  );

  return (
    <View style={{ width: "100%" }}>
      <SwipeTimestampRow
        main={main}
        timestampLabel={timeLabel}
        swipeX={swipeX}
      />
    </View>
  );
}
