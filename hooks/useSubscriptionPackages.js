import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import Purchases from "react-native-purchases";
import { configurePurchasesOnce } from "@/utils/subscription";
import {
  pickPackagesForUI,
  findOfferingByKeyword,
  rankOfferingsByKeyword,
  packageIdentifier,
} from "@/utils/subscriptionPackageHelpers";
import { TIER_SERIOUS, TIER_COMMITTED } from "./useSubscriptionTiers";

function firstOfferingWithPackages(offerings) {
  try {
    const allMap = offerings?.all || null;
    if (!allMap || typeof allMap !== "object") return null;

    const all = Object.values(allMap);
    const withPackages = all.find(
      (o) => Array.isArray(o?.availablePackages) && o.availablePackages.length,
    );
    return withPackages || all[0] || null;
  } catch {
    return null;
  }
}

function getOfferingByExactIdentifier(offerings, identifier) {
  try {
    const needle = String(identifier || "")
      .toLowerCase()
      .trim();
    if (!needle) return null;

    const allMap = offerings?.all || null;
    if (!allMap || typeof allMap !== "object") return null;

    // Fast path: most SDKs key offerings.all by identifier.
    if (allMap[identifier]) {
      return allMap[identifier];
    }
    if (allMap[needle]) {
      return allMap[needle];
    }

    // Slow path: scan values (handles odd casing / SDK differences)
    const entries = Object.entries(allMap);
    const match = entries.find(([key, off]) => {
      const id = String(off?.identifier || key || "").toLowerCase();
      return id === needle;
    });

    return match?.[1] || null;
  } catch {
    return null;
  }
}

// NEW: choose the best offering for a tier using identifier matching first,
// then falling back to the existing ranking logic.
function pickOfferingForTier(offerings, keyword, avoidIdentifier) {
  try {
    const needle = String(keyword || "").toLowerCase();
    if (!needle) return null;

    const allMap = offerings?.all || null;
    if (!allMap || typeof allMap !== "object") return null;

    const entries = Object.entries(allMap);

    // 1) Strict match: offering identifier/key includes keyword AND has packages
    const strict = entries
      .map(([key, off]) => {
        const idRaw = String(off?.identifier || key || "");
        const id = idRaw.toLowerCase();
        const hasPkgs =
          Array.isArray(off?.availablePackages) && off.availablePackages.length;

        return {
          off,
          idRaw,
          id,
          hasPkgs: !!hasPkgs,
        };
      })
      .filter((x) => x.id.includes(needle))
      .filter((x) => !avoidIdentifier || x.idRaw !== avoidIdentifier);

    const strictWithPkgs = strict.find((x) => x.hasPkgs);
    if (strictWithPkgs?.off) return strictWithPkgs.off;

    const strictAny = strict[0]?.off || null;
    if (strictAny) return strictAny;

    // 2) Ranked match (existing helper)
    const ranked = rankOfferingsByKeyword(offerings, needle);
    const rankedPick =
      (avoidIdentifier
        ? ranked.find((o) => String(o?.identifier || "") !== avoidIdentifier)
        : ranked[0]) || null;

    if (rankedPick) return rankedPick;

    // 3) Simple find fallback (existing helper)
    const found = findOfferingByKeyword(offerings, needle);
    if (found && String(found?.identifier || "") !== avoidIdentifier) {
      return found;
    }

    return found || null;
  } catch {
    return null;
  }
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function tierKeyword(tier) {
  const t = String(tier || "").toLowerCase();
  if (t === TIER_SERIOUS) return "serious";
  if (t === TIER_COMMITTED) return "committed";
  return "";
}

function filterPackagesByTierKeyword(packages, tier) {
  const pkgs = Array.isArray(packages) ? packages : [];
  const key = tierKeyword(tier);
  if (!key) return pkgs;

  // Heuristic filtering: protects us from accidentally showing/purchasing
  // Committed SKUs while the user is on the Serious tier (and vice versa).
  const withMeta = pkgs.map((p) => {
    const offeringId = normalize(p?.offeringIdentifier);
    const productId = normalize(
      p?.product?.identifier || p?.product?.productIdentifier,
    );
    const title = normalize(p?.product?.title);
    const desc = normalize(p?.product?.description);
    const pkgId = normalize(packageIdentifier(p));

    const combined = `${offeringId} ${productId} ${pkgId} ${title} ${desc}`;
    return { pkg: p, combined };
  });

  const matches = withMeta.filter((x) => x.combined.includes(key));

  // If we have matches, use them.
  if (matches.length > 0) {
    // For Serious, also avoid accidentally including committed packages.
    if (key === "serious") {
      const seriousOnly = matches.filter(
        (x) => !x.combined.includes("committed"),
      );
      return seriousOnly.length
        ? seriousOnly.map((x) => x.pkg)
        : matches.map((x) => x.pkg);
    }

    return matches.map((x) => x.pkg);
  }

  // If nothing matches, do NOT fall back to the full list.
  // It's safer to show "No plans" than let the user buy the wrong SKU.
  return [];
}

export function useSubscriptionPackages(alertTitle) {
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [packagesByTier, setPackagesByTier] = useState({
    [TIER_SERIOUS]: [],
    [TIER_COMMITTED]: [],
  });

  const loadOfferings = useCallback(async () => {
    try {
      const { ok, error: configErr } = configurePurchasesOnce();
      if (!ok) {
        throw new Error(configErr || "Subscriptions are not available.");
      }

      const offerings = await Purchases.getOfferings();

      const allKeys = (() => {
        try {
          return Object.keys(offerings?.all || {});
        } catch {
          return [];
        }
      })();

      // Prefer explicit tier offerings; only use fallback for diagnostics.
      const fallback =
        offerings?.current || firstOfferingWithPackages(offerings) || null;

      // Prefer exact identifier match first (your identifiers are ideally "serious" / "committed")
      const seriousExact = getOfferingByExactIdentifier(offerings, "serious");
      const committedExact = getOfferingByExactIdentifier(
        offerings,
        "committed",
      );

      const seriousOffering =
        seriousExact ||
        pickOfferingForTier(offerings, "serious") ||
        findOfferingByKeyword(offerings, "serious") ||
        null;

      // If we cannot find a serious offering, we should not silently use the current offering.
      // That is how we end up showing Committed prices on Serious.
      const seriousId = String(seriousOffering?.identifier || "");

      const committedOffering =
        committedExact ||
        pickOfferingForTier(offerings, "committed", seriousId) ||
        findOfferingByKeyword(offerings, "committed") ||
        null;

      // If both tiers resolve to the same offering, treat committed as missing
      // (better than selling the wrong product).
      const committedId = String(committedOffering?.identifier || "");
      const sameOffering =
        seriousId &&
        committedId &&
        seriousId.toLowerCase() === committedId.toLowerCase();

      const seriousRaw = seriousOffering?.availablePackages || [];
      const committedRaw = sameOffering
        ? []
        : committedOffering?.availablePackages || [];

      const seriousFiltered = filterPackagesByTierKeyword(
        seriousRaw,
        TIER_SERIOUS,
      );
      const committedFiltered = filterPackagesByTierKeyword(
        committedRaw,
        TIER_COMMITTED,
      );

      const seriousPicked = pickPackagesForUI(seriousFiltered);
      const committedPicked = pickPackagesForUI(committedFiltered);

      // DEV-only diagnostics: helps verify we're pulling different products/prices per tier
      if (process.env.NODE_ENV !== "production") {
        const summarize = (pkgs) =>
          (Array.isArray(pkgs) ? pkgs : []).map((p) => ({
            offering: p?.offeringIdentifier || null,
            productId:
              p?.product?.identifier || p?.product?.productIdentifier || null,
            priceString:
              p?.product?.priceString ||
              p?.product?.localizedPriceString ||
              null,
            packageType: p?.packageType || null,
          }));

        console.log("[subscription] offerings keys:", allKeys);
        console.log(
          "[subscription] serious offering:",
          seriousOffering?.identifier || fallback?.identifier || null,
        );
        console.log(
          "[subscription] serious packages:",
          summarize(seriousPicked),
        );
        console.log(
          "[subscription] committed offering:",
          committedOffering?.identifier || fallback?.identifier || null,
        );
        console.log(
          "[subscription] committed packages:",
          summarize(committedPicked),
        );
      }

      setPackagesByTier({
        [TIER_SERIOUS]: seriousPicked,
        [TIER_COMMITTED]: committedPicked,
      });
    } catch (e) {
      console.error(e);
      Alert.alert(
        alertTitle,
        e?.message || "Could not load subscription plans.",
      );
    } finally {
      setLoadingPlans(false);
    }
  }, [alertTitle]);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  return { loadingPlans, packagesByTier };
}
