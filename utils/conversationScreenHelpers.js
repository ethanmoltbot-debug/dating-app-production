export function formatDecisionShort(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return null;
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours >= 1) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${Math.max(1, minutes)}m`;
}

export function parseMatchIdFromParams(params) {
  const raw = params?.matchId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

export function parseStartTabFromParams(params) {
  const raw = params?.startTab;
  const v = Array.isArray(raw) ? raw[0] : raw;
  const s = v != null ? String(v).trim().toLowerCase() : "";
  if (s === "profile" || s === "chat" || s === "date") return s;
  return null;
}

export function parseOpenDrinkIntentFromParams(params) {
  const raw = params?.openDrink;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return String(v || "") === "1";
}
