export function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function shouldShowStarterPreview(match) {
  const realCount = Number(match?.real_message_count);
  const hasRealCount = Number.isFinite(realCount);
  if (hasRealCount) {
    if (realCount > 0) return false;
  } else {
    const lastMsgRaw =
      typeof match?.last_message === "string" ? match.last_message : "";
    const lastMsg = lastMsgRaw.trim();
    const isLegacyPreviewOnly = lastMsg
      .toLowerCase()
      .startsWith("start the chat with ");

    const hasAnyMessages =
      Boolean(match?.last_message_time) && !isLegacyPreviewOnly;
    if (hasAnyMessages) return false;
  }

  const hasStarterSummary =
    typeof match?.starter_summary === "string" &&
    match.starter_summary.trim().length > 0;

  const hasStartChatLine =
    typeof match?.start_chat_line === "string" &&
    match.start_chat_line.trim().length > 0;

  return hasStarterSummary || hasStartChatLine;
}

export function isCommittedMatch(match) {
  const committed = Boolean(match?.my_committed);
  const legacy = Boolean(match?.legacy_unlocked);
  const deposit = Number(match?.my_deposit_cents || 0);
  if (committed || legacy) return true;
  return Number.isFinite(deposit) && deposit >= 3000;
}

export function getMatchState(match) {
  // Simple state machine used across Messages/Chat:
  // - queued: matched but not yet committed
  // - committed: committed (or legacy unlocked) -> eligible to appear as a chat row
  return isCommittedMatch(match) ? "committed" : "queued";
}

export function getMatchesData(matches) {
  const list = Array.isArray(matches) ? matches : [];

  const committedMatches = list.filter((m) => isCommittedMatch(m));

  // Match queue (not committed yet)
  const queuedMatches = list.filter((m) => !isCommittedMatch(m));

  const newMatches = queuedMatches.slice(0, 12);

  const hasCommittedAny = committedMatches.length > 0;
  const primaryCommittedMatch =
    committedMatches.length > 0 ? committedMatches[0] : null;
  const hasAnyMatches = list.length > 0;
  const hasNewMatches = newMatches.length > 0;

  return {
    committedMatches,
    queuedMatches,
    newMatches,
    hasCommittedAny,
    primaryCommittedMatch,
    hasAnyMatches,
    hasNewMatches,
  };
}
