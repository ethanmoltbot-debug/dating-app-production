import { useCallback, useMemo } from "react";
import { View, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSubscription } from "@/utils/subscription";
import { useAuth } from "@/utils/auth/useAuth";
import { normalizeReturnTo } from "@/utils/dateCreditsHelpers";
import { useDateCreditsData } from "@/hooks/useDateCreditsData";
import { useDateCreditsActions } from "@/hooks/useDateCreditsActions";
import { useDateCreditsPurchase } from "@/hooks/useDateCreditsPurchase";
import { DateCreditsHeader } from "@/components/DateCreditsScreen/DateCreditsHeader";
import { CreditsBalanceCard } from "@/components/DateCreditsScreen/CreditsBalanceCard";
import { StockedUpCard } from "@/components/DateCreditsScreen/StockedUpCard";
import { PurchaseCard } from "@/components/DateCreditsScreen/PurchaseCard";
import { ContinueButton } from "@/components/DateCreditsScreen/ContinueButton";

export default function DateCreditsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { tier } = useSubscription();
  const { auth } = useAuth();
  const jwt = auth?.jwt;

  const returnToParam = useMemo(() => {
    const raw = params?.returnTo;
    const v = Array.isArray(raw) ? raw[0] : raw;
    return normalizeReturnTo(v, "/messages");
  }, [params?.returnTo]);

  const matchIdParam = useMemo(() => {
    const raw = params?.matchId;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const s = v != null ? String(v).trim() : "";
    return s || null;
  }, [params?.matchId]);

  // IMPORTANT: Use a runtime dev flag. TestFlight/App Store are release builds.
  const isDevRuntime =
    typeof globalThis !== "undefined" && Boolean(globalThis.__DEV__);

  const {
    userId,
    setUserId,
    loading,
    credits,
    setCredits,
    maxCredits,
    setMaxCredits,
    balanceCents,
    setBalanceCents,
    refresh,
  } = useDateCreditsData(jwt);

  const {
    stockedUp,
    goBack,
    linkRevenueCatToUser,
    devGrantOneCredit,
    claimCreditFromClient,
  } = useDateCreditsActions({
    userId,
    setUserId,
    jwt,
    tier,
    matchIdParam,
    returnToParam,
    router,
    refresh,
    credits,
    setCredits,
    maxCredits,
    setMaxCredits,
    balanceCents,
    setBalanceCents,
    isDevRuntime,
  });

  const {
    busy,
    purchaseNotice,
    purchaseSyncing,
    purchaseCompleted,
    startPurchase,
    priceText,
    priceLoading,
  } = useDateCreditsPurchase({
    userId,
    setUserId,
    jwt,
    credits,
    balanceCents,
    refresh,
    stockedUp,
    isDevRuntime,
    devGrantOneCredit,
    claimCreditFromClient,
    goBack,
    linkRevenueCatToUser,
  });

  const creditsCount = useMemo(() => {
    const c = Number(credits || 0);
    return Number.isFinite(c) ? c : 0;
  }, [credits]);

  const hasCredits = creditsCount > 0;

  const purchaseProcessing = useMemo(() => {
    // If purchase completed but wallet hasn't updated yet, we treat it as "processing".
    return Boolean(purchaseSyncing) || (purchaseCompleted && !hasCredits);
  }, [hasCredits, purchaseCompleted, purchaseSyncing]);

  const handleClose = useCallback(() => {
    if (purchaseProcessing && !hasCredits) {
      goBack({ purchaseState: "processing" });
      return;
    }
    goBack();
  }, [goBack, hasCredits, purchaseProcessing]);

  const handleContinue = useCallback(async () => {
    if (busy) return;

    if (hasCredits) {
      goBack();
      return;
    }

    if (purchaseProcessing) {
      // Don't encourage another purchase. Let them go back and we will sync.
      goBack({ purchaseState: "processing" });
      return;
    }

    try {
      await startPurchase();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not start purchase.");
    }
  }, [busy, goBack, hasCredits, purchaseProcessing, startPurchase]);

  const continueTitle = useMemo(() => {
    if (hasCredits) return "Continue";
    if (purchaseProcessing) return "Back to Messages";
    return "Continue";
  }, [hasCredits, purchaseProcessing]);

  const continueSubtitle = useMemo(() => {
    if (hasCredits) return null;
    if (purchaseProcessing)
      return "We’ll unlock matches as soon as it finishes.";
    return "You’ll confirm this purchase with Apple.";
  }, [hasCredits, purchaseProcessing]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#FF1744"
          testID="activity-indicator"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={["#F7EEFF", "#F2F7FF", "#FFF1F7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <DateCreditsHeader onClose={handleClose} topInset={insets.top} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <CreditsBalanceCard
          credits={credits}
          maxCredits={maxCredits}
          balanceCents={balanceCents}
          stockedUp={stockedUp}
        />

        <View style={{ height: 14 }} />

        {stockedUp ? (
          <StockedUpCard />
        ) : (
          <PurchaseCard
            priceText={priceText}
            priceLoading={priceLoading}
            purchaseNotice={purchaseNotice}
            purchaseSyncing={purchaseSyncing}
          />
        )}

        <View style={{ height: 18 }} />

        <ContinueButton
          busy={busy}
          disabled={false}
          title={continueTitle}
          subtitle={continueSubtitle}
          onPress={handleContinue}
        />
      </ScrollView>
    </View>
  );
}
