import { useMemo } from "react";
import { TIER_SERIOUS, TIER_COMMITTED } from "./useSubscriptionTiers";

export function useContextualHero(intentNorm, nameStr) {
  return useMemo(() => {
    // Inline upgrade moments (exact copy)
    if (intentNorm === "conversation_limit") {
      return {
        title: "Want more flexibility?",
        subtitle: "Become Committed to manage up to 3 conversations at once.",
        forcedTier: TIER_COMMITTED,
      };
    }

    if (intentNorm === "standouts" || intentNorm === "standouts_locked") {
      return {
        title: "Standouts are for serious users.",
        subtitle: "Upgrade to Serious to like and comment.",
        forcedTier: TIER_SERIOUS,
      };
    }

    // NEW: Serious users capped on standouts
    if (intentNorm === "standouts_more" || intentNorm === "standouts_limit") {
      return {
        title: "Want more standouts?",
        subtitle: "Become Committed to see more than 5 standouts.",
        forcedTier: TIER_COMMITTED,
      };
    }

    if (intentNorm === "insights" || intentNorm === "insights_locked") {
      return {
        title: "Trust matters before a date.",
        subtitle: "Become Committed to see Dating Activity and Follow-Through.",
        forcedTier: TIER_COMMITTED,
      };
    }

    if (intentNorm === "likes" || intentNorm === "likes_locked") {
      return {
        title: "Skip the guessing.",
        subtitle: "Become Committed to see who already likes you.",
        forcedTier: TIER_COMMITTED,
      };
    }

    if (intentNorm === "chat" && nameStr) {
      return {
        title: `Upgrade and chat with ${nameStr} now`,
        subtitle: "Become Committed to see who likes you and unlock chat.",
        forcedTier: TIER_COMMITTED,
      };
    }

    return null;
  }, [intentNorm, nameStr]);
}
