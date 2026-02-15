import { useMemo } from "react";
import {
  Gem,
  BadgeCheck,
  Sparkles,
  Heart,
  Eye,
  CheckCheck,
} from "lucide-react-native";
import { TIER_SERIOUS, TIER_COMMITTED } from "./useSubscriptionTiers";

export function useSubscriptionBenefits(selectedTier, accent) {
  const seriousBenefits = useMemo(() => {
    return [
      {
        icon: <Sparkles size={18} color={accent} />,
        title: "Standouts access",
        subtitle: "See, like, and comment on Standouts.",
      },
      {
        icon: <Heart size={18} color={accent} />,
        title: "Unlimited likes",
        subtitle: "Stay intentional without running into caps.",
      },
      {
        icon: <CheckCheck size={18} color={accent} />,
        title: "Unlimited rewinds",
        subtitle: "Fix an accidental pass without stress.",
      },
      {
        icon: <Eye size={18} color={accent} />,
        title: "Priority visibility",
        subtitle: "Be seen sooner by the right people.",
      },
      {
        icon: <BadgeCheck size={18} color={accent} />,
        title: "Fine‑tuned preferences",
        subtitle: "Dial in what you want, without widening the net.",
      },
    ];
  }, [accent]);

  const committedBenefits = useMemo(() => {
    return [
      {
        icon: <BadgeCheck size={18} color={accent} />,
        title: "Everything in Serious",
        subtitle: "Plus a few tools for clarity and control.",
      },
      {
        icon: <Eye size={18} color={accent} />,
        title: "See who likes you",
        subtitle: "Skip the guessing.",
      },
      {
        icon: <CheckCheck size={18} color={accent} />,
        title: "Up to 3 conversations",
        subtitle: "More flexibility, still calm.",
      },
      {
        icon: <Sparkles size={18} color={accent} />,
        title: "More standouts",
        subtitle: "See more than 5 Standouts.",
      },
      {
        icon: <BadgeCheck size={18} color={accent} />,
        title: "Dating insights",
        subtitle:
          "Dating Activity + Follow‑Through before you invest in a date.",
      },
      {
        icon: <Gem size={18} color={accent} />,
        title: "Passport mode",
        subtitle: "Browse while traveling or planning ahead.",
      },
    ];
  }, [accent]);

  const benefits =
    selectedTier === TIER_COMMITTED ? committedBenefits : seriousBenefits;

  const benefitsHeader = useMemo(() => {
    if (selectedTier === TIER_COMMITTED) {
      return "Committed includes";
    }
    return "Serious includes";
  }, [selectedTier]);

  return { benefits, benefitsHeader };
}
