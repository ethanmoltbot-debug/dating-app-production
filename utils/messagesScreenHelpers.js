export function formatDecision(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return null;

  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);

  if (hours >= 1) {
    return minutes > 0
      ? `${hours}h ${minutes}m remaining`
      : `${hours}h remaining`;
  }

  return `${Math.max(1, minutes)}m remaining`;
}

export function getFirstPhotoUrl(photos) {
  try {
    if (Array.isArray(photos)) {
      const first = photos.find((p) => typeof p === "string" && p.length > 0);
      return first || null;
    }

    if (typeof photos === "string") {
      const trimmed = photos.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
      if (trimmed.startsWith("[")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const first = parsed.find(
            (p) => typeof p === "string" && p.length > 0,
          );
          return first || null;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function categorizeMatches(matches) {
  const list = Array.isArray(matches) ? matches : [];

  const matchRows = list.filter((m) => String(m?.chat_state) === "match");
  const preChatRows = list.filter((m) => String(m?.chat_state) === "prechat");
  const activeChatRows = list.filter((m) => String(m?.chat_state) === "active");
  const archivedRows = list.filter((m) => String(m?.chat_state) === "archived");
  const closedRows = list.filter((m) => String(m?.chat_state) === "closed");

  return {
    matchRows,
    preChatRows,
    activeChatRows,
    archivedRows,
    closedRows,
  };
}
