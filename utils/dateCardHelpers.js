export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function parseTimeInput(value) {
  const v = String(value || "").trim();
  if (!v) return null;

  // 24h
  const m24 = v.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m24) {
    return { h: Number(m24[1]), m: Number(m24[2]) };
  }

  // 12h with optional minutes
  const m12 = v
    .replace(/\s+/g, " ")
    .match(/^(\d{1,2})(?::([0-5]\d))?\s*([AaPp][Mm])$/);
  if (!m12) return null;

  let h = Number(m12[1]);
  const m = typeof m12[2] === "string" ? Number(m12[2]) : 0;
  const ampm = String(m12[3]).toLowerCase();

  if (h < 1 || h > 12) return null;

  if (ampm === "am") {
    h = h === 12 ? 0 : h;
  } else {
    h = h === 12 ? 12 : h + 12;
  }

  return { h, m };
}

export function buildDateTimeIso(dateStrYYYYMMDD, timeInput) {
  const t = parseTimeInput(timeInput);
  if (!dateStrYYYYMMDD || !t) return null;
  const d = new Date(`${dateStrYYYYMMDD}T${pad2(t.h)}:${pad2(t.m)}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function addMinutesToIso(iso, minutesToAdd) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mins = Number(minutesToAdd);
  if (!Number.isFinite(mins)) return null;
  const out = new Date(d.getTime() + mins * 60 * 1000);
  if (Number.isNaN(out.getTime())) return null;
  return out.toISOString();
}

export function formatDayShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function buildLockedTitle(
  dateStart,
  dateEnd,
  activityLabel,
  placeLabel,
) {
  const start = dateStart ? new Date(dateStart) : null;
  if (!start || Number.isNaN(start.getTime())) {
    return "Date planned";
  }

  const day = formatDayShort(dateStart);
  const time = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const activity = activityLabel ? String(activityLabel) : "";
  const place = placeLabel ? String(placeLabel) : "";

  const left = [day, time].filter(Boolean).join(" ");
  const right = [activity, place].filter(Boolean).join(" • ");
  const full = right ? `${left} • ${right}` : left;

  const safe = full || "Date planned";
  return safe.length > 35 ? `${safe.slice(0, 34)}…` : safe;
}

export function isWithinWindow(dateStart, dateEnd) {
  if (!dateStart || !dateEnd) return false;
  const s = new Date(dateStart);
  const e = new Date(dateEnd);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
  const now = Date.now();
  return now >= s.getTime() && now <= e.getTime();
}

export function recommendStartTime(overlapTimes) {
  const times = Array.isArray(overlapTimes) ? overlapTimes : [];
  if (times.includes("Evening")) return "7:00 PM";
  if (times.includes("Daytime")) return "12:00 PM";
  if (times.includes("Late")) return "9:00 PM";
  return null;
}

export const DEFAULT_DATE_DURATION_MINUTES = 120;
