// NEW: shared helpers so multiple screens can reliably map packages to week/month/3-month
const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const parseIsoPeriod = (periodStr) => {
  // Handles common store period formats like: P1W, P7D, P1M, P3M
  const s = String(periodStr || "")
    .toUpperCase()
    .trim();
  if (!s.startsWith("P")) return null;

  const match = s.match(/^P(\d+)([DWMY])$/);
  if (!match) return null;

  const value = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(value) || value <= 0) return null;

  return { value, unit };
};

// NEW: a stable identifier helper (RevenueCat Package shape can vary slightly across SDK versions)
export function packageIdentifier(pkg) {
  return (
    pkg?.identifier ||
    pkg?.product?.identifier ||
    pkg?.product?.productIdentifier ||
    pkg?.product?.id ||
    null
  );
}

// NEW: exported so the subscription UI can always find the right package
export function detectPlanKeyFromPackage(pkg) {
  const type = normalize(pkg?.packageType);
  if (type.includes("weekly") || type === "week") return "weekly";
  if (type.includes("monthly") || type === "month") return "monthly";
  // broaden 3-month detection (RevenueCat sometimes marks these as CUSTOM)
  if (
    type.includes("threemonth") ||
    type.includes("3month") ||
    type.includes("quarter") ||
    type.includes("quarterly")
  ) {
    return "three_month";
  }

  const sp = pkg?.product?.subscriptionPeriod;

  // Newer SDKs sometimes expose an ISO-8601 duration string.
  if (typeof sp === "string") {
    const parsed = parseIsoPeriod(sp);
    if (parsed?.unit === "W" && parsed.value === 1) return "weekly";
    if (parsed?.unit === "D" && parsed.value === 7) return "weekly";
    if (parsed?.unit === "M" && parsed.value === 1) return "monthly";
    if (parsed?.unit === "M" && parsed.value === 3) return "three_month";
  }

  // Android / some SDK shapes expose an object like { unit: 'MONTH', numberOfUnits: 3 }
  if (sp && typeof sp === "object") {
    const unitRaw = String(sp?.unit || sp?.periodUnit || "").toUpperCase();
    const nRaw = sp?.numberOfUnits ?? sp?.value ?? sp?.periodNumberOfUnits;
    const n = typeof nRaw === "number" ? nRaw : Number(nRaw);

    if (unitRaw === "WEEK" && n === 1) return "weekly";
    if (unitRaw === "DAY" && n === 7) return "weekly";
    if (unitRaw === "MONTH" && n === 1) return "monthly";
    if (unitRaw === "MONTH" && n === 3) return "three_month";
  }

  // Last-ditch: infer from product id/title
  const idHint = normalize(pkg?.product?.identifier);
  const titleHint = normalize(pkg?.product?.title);
  const combined = `${idHint}${titleHint}`;
  if (combined.includes("weekly") || combined.includes("week")) return "weekly";
  if (combined.includes("monthly") || combined.includes("month"))
    return "monthly";
  if (
    combined.includes("3month") ||
    combined.includes("threemonth") ||
    combined.includes("quarter") ||
    combined.includes("quarterly") ||
    combined.includes("3mo")
  ) {
    return "three_month";
  }

  return null;
}

// NEW: sometimes RevenueCat packages are CUSTOM but still have a readable subscription period.
// This makes our UI ordering stable even when packageType detection fails.
export function inferPlanKey(pkg) {
  const byType = detectPlanKeyFromPackage(pkg);
  if (byType) return byType;

  const weeks = estimateWeeks(pkg);
  if (weeks === 1) return "weekly";
  if (weeks === 4) return "monthly";
  if (weeks === 13) return "three_month";

  return null;
}

// NEW: build a stable 3-card plan row: weekly, monthly, three months.
// Returns [{ planKey, pkg }] in the correct order when possible.
export function buildPlansRow(packages) {
  const pkgs = Array.isArray(packages) ? packages : [];

  const weekly = pkgs.find((p) => inferPlanKey(p) === "weekly") || null;
  const monthly = pkgs.find((p) => inferPlanKey(p) === "monthly") || null;
  const threeMonth =
    pkgs.find((p) => inferPlanKey(p) === "three_month") || null;

  if (weekly && monthly && threeMonth) {
    return [
      { planKey: "weekly", pkg: weekly },
      { planKey: "monthly", pkg: monthly },
      { planKey: "three_month", pkg: threeMonth },
    ];
  }

  // Fallback: keep things usable and ordered by estimated duration.
  // Unknown durations go last.
  const withMeta = pkgs.map((p) => {
    const planKey = inferPlanKey(p);
    const weeks = estimateWeeks(p);
    const sortWeeks = Number.isFinite(weeks) ? weeks : 999;

    const order =
      planKey === "weekly"
        ? 0
        : planKey === "monthly"
          ? 1
          : planKey === "three_month"
            ? 2
            : 99;

    return { pkg: p, planKey, sortWeeks, order };
  });

  withMeta.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    if (a.sortWeeks !== b.sortWeeks) return a.sortWeeks - b.sortWeeks;
    return 0;
  });

  return withMeta.slice(0, 3).map((x) => ({ planKey: x.planKey, pkg: x.pkg }));
}

// NEW: fixed Serious tier prices for UI display + savings badges
export const SERIOUS_TIER_PRICE_OVERRIDES = {
  weekly: 6.99,
  monthly: 19.99,
  three_month: 49.99,
};

// NEW: fixed Committed tier prices for UI display + savings badges
export const COMMITTED_TIER_PRICE_OVERRIDES = {
  weekly: 9.99,
  monthly: 29.99,
  three_month: 74.99,
};

export function formatUsd(amount) {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "";
  return `$${n.toFixed(2)}`;
}

export function weeksForPlanKey(planKey) {
  if (planKey === "weekly") return 1;
  if (planKey === "monthly") return 4;
  if (planKey === "three_month") return 13;
  return null;
}

export function pickPackagesForUI(availablePackages) {
  const pkgs = Array.isArray(availablePackages) ? availablePackages : [];

  // Prefer stable ordering even when we can't confidently detect all three.
  // We return ALL packages (just reordered) so we never accidentally hide purchasable items.
  const withMeta = pkgs.map((p) => {
    const planKey = inferPlanKey(p);
    const weeks = estimateWeeks(p);
    const sortWeeks = Number.isFinite(weeks) ? weeks : 999;

    const order =
      planKey === "weekly"
        ? 0
        : planKey === "monthly"
          ? 1
          : planKey === "three_month"
            ? 2
            : 99;

    return { pkg: p, order, sortWeeks };
  });

  withMeta.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    if (a.sortWeeks !== b.sortWeeks) return a.sortWeeks - b.sortWeeks;
    return 0;
  });

  return withMeta.map((x) => x.pkg);
}

export function packageTitle(pkg) {
  const typeRaw = String(pkg?.packageType || "");
  const t = typeRaw.toUpperCase();
  const tNorm = t.replace(/[^A-Z0-9]/g, "");

  if (tNorm.includes("WEEK")) return "1 week";
  if (tNorm.includes("MONTH") && !tNorm.includes("THREE")) return "1 month";
  if (tNorm.includes("THREEMONTH") || tNorm.includes("3MONTH"))
    return "3 months";

  const sp = pkg?.product?.subscriptionPeriod;
  if (typeof sp === "string") {
    const s = sp.toUpperCase();
    if (s === "P1W" || s === "P7D") return "1 week";
    if (s === "P1M") return "1 month";
    if (s === "P3M") return "3 months";
  }

  return pkg?.product?.title || "Plan";
}

export function packagePriceString(pkg) {
  const p = pkg?.product;
  return (
    p?.priceString ||
    p?.localizedPriceString ||
    p?.price_string ||
    p?.localizedPriceString ||
    ""
  );
}

export function packagePriceNumber(pkg) {
  const p = pkg?.product;
  const raw = p?.price;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function estimateWeeks(pkg) {
  const typeRaw = String(pkg?.packageType || "");
  const t = typeRaw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (t.includes("WEEK")) return 1;
  if (t.includes("THREEMONTH") || t.includes("3MONTH")) return 13;
  if (t.includes("MONTH")) return 4;

  const sp = pkg?.product?.subscriptionPeriod;
  if (typeof sp === "string") {
    const s = sp.toUpperCase();
    if (s === "P1W" || s === "P7D") return 1;
    if (s === "P1M") return 4;
    if (s === "P3M") return 13;
  }

  return null;
}

export function computeSavingsBadge(pkg, weeklyPkg) {
  const basePrice = packagePriceNumber(weeklyPkg);
  const pkgPrice = packagePriceNumber(pkg);
  const weeks = estimateWeeks(pkg);
  if (!basePrice || !pkgPrice || !weeks) return null;

  const weeklyEquivalent = pkgPrice / weeks;
  const savings = 1 - weeklyEquivalent / basePrice;
  if (!Number.isFinite(savings) || savings <= 0.05) return null;

  const pct = Math.round(savings * 100);
  return `Save ${pct}%`;
}

export function formatWeeklyEquivalent(pkg) {
  const price = packagePriceNumber(pkg);
  const weeks = estimateWeeks(pkg);
  if (!price || !weeks) return null;

  const perWeek = price / weeks;
  if (!Number.isFinite(perWeek)) return null;

  const asText = perWeek.toFixed(2);
  return `$${asText} / week`;
}

// NEW: pick an offering even if the offering identifier doesn't include the keyword.
// We score by:
//  - offering identifier match (strong)
//  - product/package identifiers and titles containing the keyword (weak but helpful)
export function rankOfferingsByKeyword(offerings, keyword) {
  const all = offerings?.all || {};
  const needle = normalize(keyword);
  if (!needle) return [];

  const scored = [];

  for (const key of Object.keys(all)) {
    const off = all[key];

    const offId = normalize(off?.identifier || key);
    let score = 0;

    if (offId.includes(needle)) {
      score += 5;
    }

    const pkgs = Array.isArray(off?.availablePackages)
      ? off.availablePackages
      : [];

    for (const p of pkgs) {
      // NOTE: RevenueCat's pkg.identifier is often "$rc_weekly" and will NOT include your tier.
      // So we score across multiple fields.
      const pkgId = normalize(packageIdentifier(p));
      const productId = normalize(p?.product?.identifier);
      const productIdAlt = normalize(p?.product?.productIdentifier);
      const title = normalize(p?.product?.title);
      const desc = normalize(p?.product?.description);

      if (
        pkgId.includes(needle) ||
        productId.includes(needle) ||
        productIdAlt.includes(needle)
      ) {
        score += 1;
      } else if (title.includes(needle)) {
        score += 1;
      } else if (desc.includes(needle)) {
        score += 1;
      }
    }

    if (score > 0) {
      scored.push({ offering: off, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.offering);
}

export function findOfferingByKeyword(offerings, keyword) {
  const ranked = rankOfferingsByKeyword(offerings, keyword);
  return ranked[0] || null;
}
