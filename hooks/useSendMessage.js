import { useCallback, useState } from "react";
import useUpload from "@/utils/useUpload";

export function useSendMessage(matchId, user, setMessages, options) {
  const onPaymentRequired = options?.onPaymentRequired;

  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceSending, setVoiceSending] = useState(false);

  // NEW: reply-to state
  const [replyTo, setReplyTo] = useState(null);

  const [upload, { loading: uploadLoading }] = useUpload();

  const clearReplyTo = useCallback(() => {
    setReplyTo(null);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || !user || sending) return;

    const messageText = inputText.trim();
    const repliedToMessageId = replyTo?.id ?? null;

    setInputText("");
    setSending(true);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          senderId: user.id,
          messageText,
          repliedToMessageId,
        }),
      });

      if (!response.ok) {
        // payment required -> open the date credit sheet and keep the draft.
        if (response.status === 402) {
          setInputText(messageText);
          try {
            onPaymentRequired?.();
          } catch (e) {
            console.error(e);
          }
          return;
        }

        const text = await response.text().catch(() => "");
        throw new Error(
          `Failed to send message: [${response.status}] ${response.statusText} ${text}`,
        );
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      clearReplyTo();
    } catch (error) {
      console.error("Error sending message:", error);
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const sendVoiceMemo = useCallback(
    async ({ uri, durationMs }) => {
      if (!user || voiceSending || uploadLoading) return;
      if (!uri || typeof uri !== "string") return;

      const repliedToMessageId = replyTo?.id ?? null;

      setVoiceSending(true);
      try {
        const fileName = `voice-memo-${Date.now()}.m4a`;
        const { url, error } = await upload({
          reactNativeAsset: {
            uri,
            fileName,
            name: fileName,
            mimeType: "audio/m4a",
          },
        });

        if (error) {
          throw new Error(error);
        }

        const response = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId,
            senderId: user.id,
            audioUrl: url,
            audioDurationMs: durationMs,
            repliedToMessageId,
            // messageText intentionally omitted
          }),
        });

        if (!response.ok) {
          // payment required -> open the date credit sheet.
          if (response.status === 402) {
            try {
              onPaymentRequired?.();
            } catch (e) {
              console.error(e);
            }
            return;
          }

          const text = await response.text().catch(() => "");
          throw new Error(
            `Failed to send voice memo: [${response.status}] ${response.statusText} ${text}`,
          );
        }

        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        clearReplyTo();
      } catch (error) {
        console.error("Error sending voice memo:", error);
      } finally {
        setVoiceSending(false);
      }
    },
    [
      matchId,
      onPaymentRequired,
      replyTo?.id,
      upload,
      uploadLoading,
      user,
      voiceSending,
      setMessages,
      clearReplyTo,
    ],
  );

  return {
    inputText,
    setInputText,
    sending,
    sendMessage,
    voiceSending,
    sendVoiceMemo,
    replyTo,
    setReplyTo,
    clearReplyTo,
  };
}
