import { useMemo } from "react";

export const TIER_SERIOUS = "serious";
export const TIER_COMMITTED = "committed";

export function useSubscriptionTiers() {
  const tierCopy = useMemo(() => {
    return {
      [TIER_SERIOUS]: {
        header: "Be intentional about who you meet.",
        description:
          "Unlock Standouts, unlimited likes, and better visibility — without increasing chaos.",
        primaryCta: "Upgrade to Serious",
        secondaryCta: "See what's included",
      },
      [TIER_COMMITTED]: {
        header: "Choose with confidence.",
        description:
          "See who likes you, manage multiple conversations, and access trust insights before you invest in a date.",
        primaryCta: "Become Committed",
        secondaryCta: "Why Committed?",
      },
    };
  }, []);

  return { tierCopy, TIER_SERIOUS, TIER_COMMITTED };
}
