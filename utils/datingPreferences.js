export const DATING_PREFS_STORAGE_KEY = "datingPreferences";

export const DEFAULT_DATING_PREFERENCES = {
  // Feed shaping (used by backend today)
  minAge: 18,
  maxAge: 50,
  maxDistance: 50,
  gender: "all", // all | women | men | nonbinary

  // NEW: height preference (inches)
  // 3'0" (36) to 7'0" (84)
  minHeightInches: 36,
  maxHeightInches: 84,

  // Passport mode: override where distance/radius is centered (optional)
  passport: {
    enabled: false,
    label: "",
    placeId: null,
    lat: null,
    lng: null,
  },

  // Hinge-like preferences (UI + persistence now; backend filtering can be added as profile data becomes available)
  // Multi-select fields are stored as arrays. Empty array means "Any".
  relationshipType: [],
  familyPlans: "any", // still single
  education: [],
  religion: [],
  politics: [],
  drinking: "any",
  smoking: "any",
  marijuana: "any",
  drugs: "any",

  // Whether each preference is a "dealbreaker"
  dealbreakers: {
    gender: false,
    age: false,
    distance: false,
    // NEW
    height: false,
    relationshipType: false,
    familyPlans: false,
    education: false,
    religion: false,
    politics: false,
    drinking: false,
    smoking: false,
    marijuana: false,
    drugs: false,
  },
};

export const PREF_DEFS = {
  gender: {
    title: "Interested in",
    type: "single",
    options: [
      { label: "Everyone", value: "all" },
      { label: "Women", value: "women" },
      { label: "Men", value: "men" },
      { label: "Nonbinary", value: "nonbinary" },
    ],
  },
  age: {
    title: "Age range",
    type: "ageRange",
  },
  distance: {
    title: "Distance",
    type: "number",
    min: 1,
    max: 500,
    step: 5,
    unitLabel: "miles",
  },

  // NEW
  height: {
    title: "Height range",
    type: "heightRange",
  },

  relationshipType: {
    title: "Relationship type",
    type: "multi",
    options: [
      { label: "Monogamy", value: "monogamy" },
      { label: "Non-monogamy", value: "non_monogamy" },
      { label: "Figuring it out", value: "figuring_out" },
    ],
  },
  familyPlans: {
    title: "Family plans",
    type: "single",
    options: [
      { label: "Any", value: "any" },
      { label: "Wants children", value: "wants_children" },
      { label: "Doesn't want children", value: "doesnt_want_children" },
      { label: "Open to children", value: "open_to_children" },
    ],
  },
  education: {
    title: "Education",
    type: "multi",
    options: [
      { label: "High school", value: "high_school" },
      { label: "Some college", value: "some_college" },
      { label: "Bachelor's", value: "bachelors" },
      { label: "Master's", value: "masters" },
      { label: "Doctorate", value: "doctorate" },
    ],
  },
  religion: {
    title: "Religion",
    type: "multi",
    options: [
      { label: "Christian", value: "christian" },
      { label: "Jewish", value: "jewish" },
      { label: "Muslim", value: "muslim" },
      { label: "Hindu", value: "hindu" },
      { label: "Buddhist", value: "buddhist" },
      { label: "Spiritual", value: "spiritual" },
      { label: "Atheist", value: "atheist" },
      { label: "Agnostic", value: "agnostic" },
      { label: "Other", value: "other" },
    ],
  },
  politics: {
    title: "Politics",
    type: "multi",
    options: [
      { label: "Liberal", value: "liberal" },
      { label: "Moderate", value: "moderate" },
      { label: "Conservative", value: "conservative" },
      { label: "Other", value: "other" },
    ],
  },
  drinking: {
    title: "Drinking",
    type: "single",
    options: [
      { label: "Any", value: "any" },
      { label: "Yes", value: "yes" },
      { label: "Sometimes", value: "sometimes" },
      { label: "No", value: "no" },
    ],
  },
  smoking: {
    title: "Smoking",
    type: "single",
    options: [
      { label: "Any", value: "any" },
      { label: "Yes", value: "yes" },
      { label: "Sometimes", value: "sometimes" },
      { label: "No", value: "no" },
    ],
  },
  marijuana: {
    title: "Marijuana",
    type: "single",
    options: [
      { label: "Any", value: "any" },
      { label: "Yes", value: "yes" },
      { label: "Sometimes", value: "sometimes" },
      { label: "No", value: "no" },
    ],
  },
  drugs: {
    title: "Drugs",
    type: "single",
    options: [
      { label: "Any", value: "any" },
      { label: "Yes", value: "yes" },
      { label: "Sometimes", value: "sometimes" },
      { label: "No", value: "no" },
    ],
  },
};

export function normalizePrefsFromStorage(parsed) {
  const safe = parsed && typeof parsed === "object" ? parsed : {};
  const merged = { ...DEFAULT_DATING_PREFERENCES, ...safe };

  const ensureArray = (v) => {
    if (Array.isArray(v)) return v;
    if (!v || v === "any") return [];
    // backwards compat: if previously stored as string
    return [String(v)];
  };

  const mergedDealbreakers = {
    ...DEFAULT_DATING_PREFERENCES.dealbreakers,
    ...(safe.dealbreakers && typeof safe.dealbreakers === "object"
      ? safe.dealbreakers
      : {}),
  };

  const rawPassport =
    safe.passport && typeof safe.passport === "object" ? safe.passport : {};

  const latNum =
    rawPassport.lat === null || rawPassport.lat === undefined
      ? null
      : Number(rawPassport.lat);
  const lngNum =
    rawPassport.lng === null || rawPassport.lng === undefined
      ? null
      : Number(rawPassport.lng);

  const passportLat = Number.isFinite(latNum) ? latNum : null;
  const passportLng = Number.isFinite(lngNum) ? lngNum : null;

  // NEW: clamp height prefs to a safe range, keep at least 1 inch gap (RangeSlider requirement)
  const rawMinH =
    typeof merged.minHeightInches === "number"
      ? merged.minHeightInches
      : Number(merged.minHeightInches);
  const rawMaxH =
    typeof merged.maxHeightInches === "number"
      ? merged.maxHeightInches
      : Number(merged.maxHeightInches);

  const minH = Number.isFinite(rawMinH)
    ? rawMinH
    : DEFAULT_DATING_PREFERENCES.minHeightInches;
  const maxH = Number.isFinite(rawMaxH)
    ? rawMaxH
    : DEFAULT_DATING_PREFERENCES.maxHeightInches;

  const clampedMinH = Math.max(36, Math.min(83, Math.round(minH)));
  const clampedMaxH = Math.max(clampedMinH + 1, Math.min(84, Math.round(maxH)));

  return {
    ...merged,
    relationshipType: ensureArray(merged.relationshipType),
    education: ensureArray(merged.education),
    religion: ensureArray(merged.religion),
    politics: ensureArray(merged.politics),
    dealbreakers: mergedDealbreakers,
    passport: {
      ...DEFAULT_DATING_PREFERENCES.passport,
      ...(merged.passport && typeof merged.passport === "object"
        ? merged.passport
        : {}),
      enabled: !!rawPassport.enabled,
      label: String(rawPassport.label || ""),
      placeId: rawPassport.placeId ? String(rawPassport.placeId) : null,
      lat: passportLat,
      lng: passportLng,
    },

    // NEW
    minHeightInches: clampedMinH,
    maxHeightInches: clampedMaxH,
  };
}

export function prefsSummary(key, prefs) {
  if (!prefs) {
    return "";
  }

  if (key === "age") {
    return `${prefs.minAge}–${prefs.maxAge}`;
  }

  if (key === "distance") {
    return `${prefs.maxDistance} miles`;
  }

  // NEW
  if (key === "height") {
    const minH = Number(prefs?.minHeightInches);
    const maxH = Number(prefs?.maxHeightInches);
    if (!Number.isFinite(minH) || !Number.isFinite(maxH)) {
      return "Any";
    }
    const ftMin = Math.floor(minH / 12);
    const inMin = minH % 12;
    const ftMax = Math.floor(maxH / 12);
    const inMax = maxH % 12;
    return `${ftMin}'${inMin}"–${ftMax}'${inMax}"`;
  }

  if (key === "passport") {
    const enabled = !!prefs?.passport?.enabled;
    if (!enabled) return "Off";
    const label = String(prefs?.passport?.label || "").trim();
    return label ? `On • ${label}` : "On";
  }

  const value = prefs[key];
  const def = PREF_DEFS[key];

  if (!def) {
    return value != null ? String(value) : "";
  }

  if (def.type === "multi") {
    const arr = Array.isArray(value) ? value : [];
    if (!arr.length) return "Any";

    const labels = arr
      .map((v) => def.options.find((o) => o.value === v)?.label)
      .filter(Boolean);

    if (!labels.length) return "Any";
    return labels.join(", ");
  }

  if (def.type !== "single") {
    return value != null ? String(value) : "";
  }

  const opt = def.options.find((o) => o.value === value);
  return opt ? opt.label : "Any";
}
