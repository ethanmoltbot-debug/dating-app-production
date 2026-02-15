export function formatGender(value) {
  if (value === "female") return "Woman";
  if (value === "male") return "Man";
  if (value === "non-binary" || value === "nonbinary") return "Non-binary";
  if (value === "other") return "Other";
  return String(value || "");
}

export function formatDistanceMiles(distanceMiles) {
  const n = Number(distanceMiles);
  if (!Number.isFinite(n) || n < 0) {
    return "";
  }

  if (n < 1) {
    return "Less than a mile away";
  }

  const rounded = Math.round(n);
  if (rounded === 1) {
    return "1 mile away";
  }
  return `${rounded} miles away`;
}

export function normalizeAudienceGenderFromProfile(profile) {
  const g = String(profile?.gender || "")
    .toLowerCase()
    .trim();

  // IMPORTANT: check female/woman BEFORE male/man.
  // Otherwise "female" matches "male" (substring) and we misclassify women.
  if (g.includes("female") || g.includes("woman")) return "FEMALE";
  if (g.includes("male") || g.includes("man")) return "MALE";
  return "FEMALE";
}

export function getMaterialLine(audienceGender) {
  if (audienceGender === "MALE") {
    return "You're husband material.";
  }
  if (audienceGender === "FEMALE") {
    return "You're Wifey material.";
  }
  return "You're Wifey / husband material.";
}

export function getMaterialEmoji(audienceGender) {
  if (audienceGender === "MALE") {
    return "🤵";
  }
  if (audienceGender === "FEMALE") {
    return "💍";
  }
  return "💍";
}
