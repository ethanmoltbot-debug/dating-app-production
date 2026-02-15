export function pad2(n) {
  return String(n).padStart(2, "0");
}

// Accepts either 24h ("19:00") OR 12h ("7:00 PM", "7 PM", "7pm")
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

export function formatDateLabel(dateStr) {
  if (!dateStr) return "Pick a date";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Pick a date";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatLockedTitle(
  dateStart,
  dateEnd,
  activityLabel,
  placeLabel,
) {
  const start = dateStart ? new Date(dateStart) : null;

  const day = start
    ? start.toLocaleDateString(undefined, { weekday: "short" })
    : "";

  const time = start
    ? start.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const activity = activityLabel ? String(activityLabel) : "";
  const place = placeLabel ? String(placeLabel) : "";

  const left = [day, time].filter(Boolean).join(" ");
  const right = [activity, place].filter(Boolean).join(" • ");
  const full = right ? `${left} • ${right}` : left;

  const safe = full || "Date planned";
  return safe.length > 42 ? `${safe.slice(0, 41)}…` : safe;
}

export function formatTimeLabelFromIso(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTimeRangeLine(dateStart, dateEnd) {
  if (!dateStart) return "";
  const s = new Date(dateStart);
  if (Number.isNaN(s.getTime())) return "";

  const dayLabel = s.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeLabel = s.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dayLabel} • ${timeLabel}`;
}
