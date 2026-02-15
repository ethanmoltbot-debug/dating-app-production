import { useState, useCallback } from "react";
import { Alert } from "react-native";
import Purchases from "react-native-purchases";

export function useSubscriptionActions(
  isAvailable,
  error,
  refresh,
  goBack,
  alertTitle,
  hasSelectedTier,
  selectedPkg,
) {
  const [purchasing, setPurchasing] = useState(false);

  const onSubscribe = useCallback(async () => {
    // If already has this tier, treat as "Done".
    if (hasSelectedTier) {
      goBack();
      return;
    }

    if (!isAvailable) {
      Alert.alert(
        alertTitle,
        error || "Subscriptions are not available right now.",
      );
      return;
    }

    if (!selectedPkg) {
      Alert.alert(alertTitle, "Please pick a plan.");
      return;
    }

    try {
      setPurchasing(true);
      await Purchases.purchasePackage(selectedPkg);
      await refresh();
      goBack();
    } catch (e) {
      const cancelled = e?.userCancelled || e?.code === "PURCHASE_CANCELLED";
      if (cancelled) {
        return;
      }
      console.error(e);
      Alert.alert(alertTitle, "Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }, [
    alertTitle,
    error,
    goBack,
    hasSelectedTier,
    isAvailable,
    refresh,
    selectedPkg,
  ]);

  const onRestore = useCallback(async () => {
    if (!isAvailable) {
      Alert.alert(
        alertTitle,
        error || "Subscriptions are not available right now.",
      );
      return;
    }

    try {
      setPurchasing(true);
      await Purchases.restorePurchases();
      await refresh();
      goBack();
    } catch (e) {
      console.error(e);
      Alert.alert(alertTitle, "Could not restore purchases.");
    } finally {
      setPurchasing(false);
    }
  }, [alertTitle, error, goBack, isAvailable, refresh]);

  return { purchasing, onSubscribe, onRestore };
}
