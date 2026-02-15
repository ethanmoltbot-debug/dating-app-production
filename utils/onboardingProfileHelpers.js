export function safeJsonObject(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore
  }
  return {};
}

export function getNested(obj, path, fallback) {
  try {
    const parts = Array.isArray(path) ? path : String(path).split(".");
    let cur = obj;
    for (const p of parts) {
      if (!cur || typeof cur !== "object") return fallback;
      cur = cur[p];
    }
    return cur === undefined ? fallback : cur;
  } catch {
    return fallback;
  }
}

export function formatHeight(inches) {
  const n = Number(inches);
  if (!Number.isFinite(n) || n <= 0) return "";
  const ft = Math.floor(n / 12);
  const inch = n % 12;
  return `${ft}'${inch}"`;
}

export function buildHeightOptions() {
  const out = [];
  // 4'10" (58) to 6'8" (80)
  for (let i = 58; i <= 80; i += 1) {
    out.push({ inches: i, label: formatHeight(i) });
  }
  return out;
}

export const HEIGHT_OPTIONS = buildHeightOptions();

export const INTEREST_OPTIONS = [
  "Travel",
  "Coffee",
  "Gym",
  "Yoga",
  "Running",
  "Hiking",
  "Cooking",
  "Foodie",
  "Wine",
  "Reading",
  "Podcasts",
  "Music",
  "Concerts",
  "Movies",
  "Photography",
  "Art",
  "Museums",
  "Dancing",
  "Volunteering",
  "Tech",
  "Entrepreneurship",
  "Fashion",
  "Sports",
  "Basketball",
  "Soccer",
  "Tennis",
  "Skiing",
  "Beach",
  "Dogs",
  "Cats",
];
