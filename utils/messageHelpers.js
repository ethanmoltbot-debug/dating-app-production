export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDurationMs(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return "0:00";
  const totalSeconds = Math.floor(n / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function tryParseJson(text) {
  try {
    if (!text) return null;
    const s = String(text);
    if (!s.startsWith("{")) return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function getDateInvite(message) {
  const parsed = tryParseJson(message?.message_text);
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.type !== "date_invite") return null;
  if (!parsed.date || typeof parsed.date !== "object") return null;
  return parsed;
}

export function formatReviewLine({ rating, ratingsTotal }) {
  const r = Number(rating);
  const n = Number(ratingsTotal);

  const hasRating = Number.isFinite(r);
  const hasCount = Number.isFinite(n) && n > 0;

  if (!hasRating && !hasCount) return null;

  const ratingText = hasRating ? r.toFixed(1) : null;
  const countText = hasCount ? `${n.toLocaleString()} reviews` : null;

  if (ratingText && countText) return `${ratingText} • ${countText}`;
  if (ratingText) return ratingText;
  return countText;
}

export function getReplyPreview(message) {
  const hasReply =
    message?.replied_to_message_id != null ||
    message?.reply_message_text != null ||
    message?.reply_audio_url != null;

  if (!hasReply) return null;

  const type = String(message?.reply_message_type || "TEXT").toUpperCase();
  const hasAudio = type === "AUDIO" || Boolean(message?.reply_audio_url);

  if (hasAudio) {
    return "Voice memo";
  }

  const txt = String(message?.reply_message_text || "").trim();
  if (!txt) return "Message";
  return txt.length > 80 ? `${txt.slice(0, 80)}…` : txt;
}
