import { useCallback, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

export function useMessageActions({ userId, matchId, onReply, onToggleLike }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("HARASSMENT");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const lastTapRef = useRef({ messageId: null, ts: 0 });

  const closeReport = useCallback(() => {
    setReportOpen(false);
    setReportSending(false);
    setReportDesc("");
    setReportTarget(null);
  }, []);

  const openReportForMessage = useCallback(
    (message) => {
      if (!message) return;
      const sender = Number(message?.sender_id);
      const me = Number(userId);
      if (!Number.isFinite(sender) || !Number.isFinite(me)) return;
      if (sender === me) return;

      setReportTarget(message);
      setReportType("HARASSMENT");
      setReportDesc("");
      setReportOpen(true);
    },
    [userId],
  );

  const submitMessageReport = useCallback(async () => {
    const me = Number(userId);
    const sender = Number(reportTarget?.sender_id);

    if (!Number.isFinite(me) || !Number.isFinite(sender)) {
      Alert.alert("Report failed", "Could not identify this message.");
      return;
    }

    const description = String(reportDesc || "").trim();
    if (!description) {
      Alert.alert("Add details", "Please add a short description.");
      return;
    }

    const msgId = reportTarget?.id;
    const msgText = String(reportTarget?.message_text || "").slice(0, 500);
    const msgType = String(reportTarget?.message_type || "TEXT").toUpperCase();

    const contextParts = [
      `matchId=${matchId != null ? String(matchId) : ""}`,
      `messageId=${msgId != null ? String(msgId) : ""}`,
      `messageType=${msgType}`,
      `messageText=${msgText}`,
    ];

    const fullDescription =
      `${description}\n\n---\n${contextParts.join("\n")}`.slice(0, 5000);

    try {
      setReportSending(true);
      const resp = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterUserId: me,
          reportedUserId: sender,
          reportType,
          description: fullDescription,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `When posting /api/reports, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }

      closeReport();
      Alert.alert(
        "Report sent",
        "Thanks — our team will review it. You can also block this user from the menu.",
      );
    } catch (e) {
      console.error("Could not report message", e);
      Alert.alert("Report failed", "Could not send your report right now.");
    } finally {
      setReportSending(false);
    }
  }, [closeReport, matchId, reportDesc, reportTarget, reportType, userId]);

  const openMessageActions = useCallback(
    (message) => {
      if (!message) return;
      const sender = Number(message?.sender_id);
      const me = Number(userId);

      const isSystem = message.sender_id == null;
      if (isSystem) return;

      const isMine =
        Number.isFinite(sender) && Number.isFinite(me) && sender === me;

      const liked = Boolean(message?.liked_by_me);

      const buttons = [];

      buttons.push({
        text: "Reply",
        onPress: () => {
          try {
            onReply?.(message);
          } catch (e) {
            console.error(e);
          }
        },
      });

      if (!isMine) {
        buttons.push({
          text: liked ? "Unlike" : "Like",
          onPress: () => {
            try {
              onToggleLike?.(message);
            } catch (e) {
              console.error(e);
            }
          },
        });

        buttons.push({
          text: "Report",
          style: "destructive",
          onPress: () => openReportForMessage(message),
        });
      }

      buttons.push({ text: "Cancel", style: "cancel" });

      Alert.alert("Message", "What would you like to do?", buttons);
    },
    [onReply, onToggleLike, openReportForMessage, userId],
  );

  const handleMaybeDoubleTapLike = useCallback(
    (message) => {
      if (!message) return;
      if (typeof onToggleLike !== "function") return;

      const sender = Number(message?.sender_id);
      const me = Number(userId);

      if (Number.isFinite(sender) && Number.isFinite(me) && sender === me) {
        return;
      }

      const now = Date.now();
      const prev = lastTapRef.current;
      const sameMessage = prev.messageId === message?.id;
      const withinWindow = now - prev.ts < 280;

      lastTapRef.current = { messageId: message?.id, ts: now };

      if (sameMessage && withinWindow) {
        onToggleLike(message);
      }
    },
    [onToggleLike, userId],
  );

  const reportPreview = useMemo(() => {
    const t = String(reportTarget?.message_text || "").trim();
    if (t) return t;
    if (reportTarget?.audio_url) return "Voice memo";
    return null;
  }, [reportTarget?.audio_url, reportTarget?.message_text]);

  return {
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
  };
}
