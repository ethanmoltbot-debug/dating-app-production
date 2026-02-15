import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSubscription } from "@/utils/subscription";
import {
  buildPlansRow,
  inferPlanKey,
  packageIdentifier,
} from "@/utils/subscriptionPackageHelpers";
import {
  useSubscriptionTiers,
  TIER_SERIOUS,
  TIER_COMMITTED,
} from "@/hooks/useSubscriptionTiers";
import { useSubscriptionBenefits } from "@/hooks/useSubscriptionBenefits";
import { useContextualHero } from "@/hooks/useContextualHero";
import { useSubscriptionPackages } from "@/hooks/useSubscriptionPackages";
import { useSubscriptionActions } from "@/hooks/useSubscriptionActions";
import { SubscriptionHeader } from "@/components/Subscription/SubscriptionHeader";
import { TierSwitch } from "@/components/Subscription/TierSwitch";
import { HeroSection } from "@/components/Subscription/HeroSection";
import { PlansSection } from "@/components/Subscription/PlansSection";
import { BenefitsSection } from "@/components/Subscription/BenefitsSection";
import { BottomActionBar } from "@/components/Subscription/BottomActionBar";

function normalizeReturnTo(raw) {
  if (!raw) return null;

  let s = String(raw || "").trim();
  if (!s) return null;

  try {
    s = decodeURIComponent(s);
  } catch {
    // ignore
  }

  const parts = s.split("?");
  const baseRaw = parts[0] || "";
  const query = parts.length > 1 ? parts.slice(1).join("?") : "";

  let base = String(baseRaw).trim();
  if (!base.startsWith("/")) base = `/${base}`;

  if (base.startsWith("/(tabs)")) {
    base = base.slice("/(tabs)".length) || "/";
    if (!base.startsWith("/")) base = `/${base}`;
  }

  if (!base || base === "/") {
    base = "/home";
  }

  return query ? `${base}?${query}` : base;
}

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { returnTo, intent, name, tier: tierParam } = useLocalSearchParams();

  const returnToStr = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const normalizedReturnTo = useMemo(
    () => normalizeReturnTo(returnToStr),
    [returnToStr],
  );
  const intentStr = Array.isArray(intent) ? intent[0] : intent;
  const nameStrRaw = Array.isArray(name) ? name[0] : name;
  const nameStr = String(nameStrRaw || "").trim();

  const tierParamStr = Array.isArray(tierParam) ? tierParam[0] : tierParam;
  const tierParamNorm = String(tierParamStr || "").toLowerCase();

  const {
    isSerious,
    isCommitted,
    isAvailable,
    error,
    refresh,
    isAdminOverride,
    tier,
  } = useSubscription();

  const scrollRef = useRef(null);

  const { tierCopy } = useSubscriptionTiers();

  const intentNorm = String(intentStr || "").toLowerCase();

  const requiredTier = useMemo(() => {
    // Contextual upgrade moments
    if (intentNorm === "standouts" || intentNorm === "standouts_locked") {
      return TIER_SERIOUS;
    }

    // NEW: more-standouts moment (Serious users hit the cap)
    if (intentNorm === "standouts_more" || intentNorm === "standouts_limit") {
      return TIER_COMMITTED;
    }

    if (
      intentNorm === "likes" ||
      intentNorm === "likes_locked" ||
      intentNorm === "chat" ||
      intentNorm === "conversation_limit" ||
      intentNorm === "insights" ||
      intentNorm === "insights_locked"
    ) {
      return TIER_COMMITTED;
    }

    if (tierParamNorm === TIER_COMMITTED) return TIER_COMMITTED;
    if (tierParamNorm === TIER_SERIOUS) return TIER_SERIOUS;

    // Default to Serious (feels calmer + aligns with your product philosophy).
    return TIER_SERIOUS;
  }, [intentNorm, tierParamNorm]);

  const [selectedTier, setSelectedTier] = useState(requiredTier);

  useEffect(() => {
    setSelectedTier(requiredTier);
  }, [requiredTier]);

  const [selectedIdentifier, setSelectedIdentifier] = useState(null);

  // Match the rest of the app's purple/pink accent (Discover/Profile/Likes)
  const accent = "#A855F7";

  // Use a neutral alert title (avoid "Wifey+" branding)
  const alertTitle = "Subscription";

  const { loadingPlans, packagesByTier } = useSubscriptionPackages(alertTitle);

  const packages = packagesByTier[selectedTier] || [];

  // Build a stable 3-card row for both tiers: week / month / 3 months.
  const plans = useMemo(() => {
    return buildPlansRow(packages);
  }, [packages]);

  useEffect(() => {
    // Pick a default package whenever the tier changes.
    // Prefer the 1-month plan when available.
    const safePlans = Array.isArray(plans) ? plans : [];

    const monthPlan = safePlans.find((p) => p?.planKey === "monthly") || null;
    const monthId = packageIdentifier(monthPlan?.pkg);

    if (monthId) {
      setSelectedIdentifier(monthId);
      return;
    }

    const firstPlanWithPkg = safePlans.find((p) => packageIdentifier(p?.pkg));
    const firstId = packageIdentifier(firstPlanWithPkg?.pkg);
    setSelectedIdentifier(firstId);
  }, [selectedTier, plans]);

  const selectedPkg = useMemo(() => {
    if (!selectedIdentifier) return null;
    return (
      packages.find((p) => packageIdentifier(p) === selectedIdentifier) || null
    );
  }, [packages, selectedIdentifier]);

  const weeklyPkg = useMemo(() => {
    return packages.find((p) => inferPlanKey(p) === "weekly") || null;
  }, [packages]);

  const goBack = useCallback(() => {
    if (normalizedReturnTo) {
      router.replace(normalizedReturnTo);
      return;
    }
    router.back();
  }, [normalizedReturnTo, router]);

  const hasSelectedTier = useMemo(() => {
    if (selectedTier === TIER_SERIOUS) return Boolean(isSerious);
    if (selectedTier === TIER_COMMITTED) return Boolean(isCommitted);
    return false;
  }, [isCommitted, isSerious, selectedTier]);

  const adminTierLabel = useMemo(() => {
    if (!isAdminOverride) return null;
    if (tier === "committed") return "Committed";
    if (tier === "serious") return "Serious";
    return "Membership";
  }, [isAdminOverride, tier]);

  const adminBannerText = useMemo(() => {
    if (!isAdminOverride || !adminTierLabel) return null;
    if (hasSelectedTier) {
      return "Granted by admin";
    }

    return `You already have ${adminTierLabel} granted by admin`;
  }, [adminTierLabel, hasSelectedTier, isAdminOverride]);

  const { purchasing, onSubscribe, onRestore } = useSubscriptionActions(
    isAvailable,
    error,
    refresh,
    goBack,
    alertTitle,
    hasSelectedTier,
    selectedPkg,
  );

  const isBusy = purchasing;

  const contextualHero = useContextualHero(intentNorm, nameStr);

  // If a context requires a tier, keep the UI pinned to it.
  useEffect(() => {
    const forced = contextualHero?.forcedTier;
    if (!forced) return;
    if (selectedTier === forced) return;
    setSelectedTier(forced);
  }, [contextualHero?.forcedTier, selectedTier]);

  const heroTitle = useMemo(() => {
    if (hasSelectedTier) {
      if (selectedTier === TIER_COMMITTED) return "Committed is active";
      if (selectedTier === TIER_SERIOUS) return "Serious is active";
      return "Subscription is active";
    }

    if (contextualHero?.title) return contextualHero.title;

    return tierCopy[selectedTier]?.header || "Upgrade";
  }, [contextualHero?.title, hasSelectedTier, selectedTier, tierCopy]);

  const heroSubtitle = useMemo(() => {
    if (hasSelectedTier) {
      if (isAdminOverride) {
        return "Access granted by admin.";
      }
      return "You're set.";
    }

    if (contextualHero?.subtitle) return contextualHero.subtitle;

    return tierCopy[selectedTier]?.description || "";
  }, [
    contextualHero?.subtitle,
    hasSelectedTier,
    isAdminOverride,
    selectedTier,
    tierCopy,
  ]);

  const primaryCta = useMemo(() => {
    if (hasSelectedTier) return "DONE";
    return tierCopy[selectedTier]?.primaryCta || "CONTINUE";
  }, [hasSelectedTier, selectedTier, tierCopy]);

  const secondaryCta = useMemo(() => {
    return tierCopy[selectedTier]?.secondaryCta || "Learn more";
  }, [selectedTier, tierCopy]);

  const onPressSecondary = useCallback(() => {
    // Simple: scroll down a bit to the benefits.
    scrollRef.current?.scrollTo?.({ y: 520, animated: true });
  }, []);

  const { benefits, benefitsHeader } = useSubscriptionBenefits(
    selectedTier,
    accent,
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <SubscriptionHeader onClose={goBack} />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 170 }}
        showsVerticalScrollIndicator={false}
      >
        {!contextualHero?.forcedTier ? (
          <TierSwitch
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
            accent={accent}
          />
        ) : null}

        <HeroSection
          heroTitle={heroTitle}
          heroSubtitle={heroSubtitle}
          adminBannerText={adminBannerText}
          secondaryCta={secondaryCta}
          onPressSecondary={onPressSecondary}
          accent={accent}
        />

        <PlansSection
          loadingPlans={loadingPlans}
          plans={plans}
          selectedIdentifier={selectedIdentifier}
          onSelectPackage={setSelectedIdentifier}
          weeklyPkg={weeklyPkg}
          accent={accent}
          selectedTier={selectedTier}
        />

        <BenefitsSection benefits={benefits} benefitsHeader={benefitsHeader} />
      </ScrollView>

      <BottomActionBar
        insets={insets}
        primaryCta={primaryCta}
        isBusy={isBusy}
        onSubscribe={onSubscribe}
        onRestore={onRestore}
        isAvailable={isAvailable}
        error={error}
        alertTitle={alertTitle}
        accent={accent}
      />
    </View>
  );
}
