export function parseBirthdateToIsoDate(input) {
  const s = String(input || "").trim();
  if (!s) return null;

  // Accept YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      return null;
    }
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Accept MM/DD/YYYY
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const m = Number(us[1]);
    const d = Number(us[2]);
    const y = Number(us[3]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      return null;
    }
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return null;
}

export function computeAgeFromIsoDate(isoDate) {
  const m = String(isoDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - y;
  const hasHadBirthdayThisYear =
    now.getMonth() + 1 > mo ||
    (now.getMonth() + 1 === mo && now.getDate() >= d);
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function daysInMonth(year, month1to12) {
  const y = Number(year);
  const m = Number(month1to12);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return 31;
  // JS Date: month is 1-12 here; day 0 gives last day of previous month, so this works.
  return new Date(y, m, 0).getDate();
}

export function formatBirthdateLabel(isoDate) {
  const m = String(isoDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthLabel = monthNames[Math.max(0, Math.min(11, month - 1))];
  if (!monthLabel || !Number.isFinite(day) || !Number.isFinite(year)) return "";
  return `${monthLabel} ${day}, ${year}`;
}
