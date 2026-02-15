import { useState, useCallback, useEffect } from "react";
import { Alert, Platform } from "react-native";
import Purchases, { PRODUCT_CATEGORY } from "react-native-purchases";
import { configurePurchasesOnce } from "@/utils/subscription";
import {
  DATE_CREDIT_PRODUCT_IDS,
  getRCProductId,
  extractLatestTransactionIdFromCustomerInfo,
  safeReadUserFromStorage,
} from "@/utils/dateCreditsHelpers";

export function useDateCreditsPurchase({
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
}) {
  const [busy, setBusy] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState(null);
  const [purchaseSyncing, setPurchaseSyncing] = useState(false);
  const [purchaseCompleted, setPurchaseCompleted] = useState(false);

  const [priceText, setPriceText] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Load localized price so the screen can display it without a second "Buy" button.
  useEffect(() => {
    let alive = true;

    (async () => {
      if (Platform.OS === "web") return;

      setPriceLoading(true);

      try {
        const { ok } = configurePurchasesOnce();
        if (!ok) {
          if (alive) setPriceText(null);
          return;
        }

        const preferredId = DATE_CREDIT_PRODUCT_IDS[0];

        // Try Offerings first (best for localized price).
        const offerings = await Purchases.getOfferings().catch(() => null);
        const pkgs = offerings?.current?.availablePackages;
        const packagesArray = Array.isArray(pkgs) ? pkgs : [];

        let foundProduct = null;

        for (const pkg of packagesArray) {
          const pid = getRCProductId(pkg?.product);
          if (pid === preferredId) {
            foundProduct = pkg?.product;
            break;
          }
        }

        if (!foundProduct) {
          // Fallback: fetch products directly.
          const nonSubCategory = PRODUCT_CATEGORY?.NON_SUBSCRIPTION || null;
          const prods = nonSubCategory
            ? await Purchases.getProducts([preferredId], nonSubCategory)
            : await Purchases.getProducts([preferredId]);

          const arr = Array.isArray(prods) ? prods : [];
          foundProduct = arr[0] || null;
        }

        const candidate =
          foundProduct?.priceString ||
          foundProduct?.localizedPriceString ||
          foundProduct?.localizedPrice ||
          null;

        const nextPriceText = candidate != null ? String(candidate).trim() : "";

        if (alive) {
          setPriceText(nextPriceText || null);
        }
      } catch (e) {
        console.error(e);
        if (alive) setPriceText(null);
      } finally {
        if (alive) setPriceLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const startPurchase = useCallback(async () => {
    if (busy) return;

    if (stockedUp) {
      Alert.alert(
        "You're stocked up",
        "Use a credit first to make room for more.",
      );
      return;
    }

    // IMPORTANT: In TestFlight, AsyncStorage can sometimes lag behind the real
    // authenticated user. If we have a JWT, force a refresh to resolve the
    // correct legacy user id before purchasing.
    let uid = userId;
    const hasJwt = jwt && typeof jwt === "string";
    if (!uid && hasJwt) {
      try {
        await refresh(null);
        const u = await safeReadUserFromStorage();
        const resolved = Number(u?.id);
        if (Number.isFinite(resolved)) {
          uid = resolved;
          setUserId(resolved);
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!uid) {
      Alert.alert("Sign in", "Please sign in again.");
      return;
    }

    if (Platform.OS === "web") {
      Alert.alert("Not available", "Credits can only be purchased on iOS.");
      return;
    }

    setBusy(true);
    setPurchaseNotice(null);
    setPurchaseSyncing(false);

    // Capture baseline so we can detect when the webhook-backed wallet updates.
    const baselineCredits = Number(credits || 0);
    const baselineBalance = Number(balanceCents || 0);

    try {
      const { ok, error } = configurePurchasesOnce();
      if (!ok) {
        Alert.alert(
          "Purchases unavailable",
          error || "Purchases are not available.",
        );
        return;
      }

      // Best effort: ensure RevenueCat user is linked to our backend user id.
      // We do BOTH: attributes + logIn.
      await Purchases.setAttributes({ userId: String(uid) }).catch(() => null);
      await Purchases.logIn(String(uid)).catch(() => null);

      // Ensure webhook can map anonymous ids too.
      await linkRevenueCatToUser(uid);

      const preferredId = DATE_CREDIT_PRODUCT_IDS[0];

      // Prefer purchasing via Offerings/Packages when possible.
      // This tends to be the most reliable across SDK versions.
      let purchased = false;
      let purchaseCustomerInfo = null;
      let purchaseResult = null; // NEW: keep the raw result so we can extract a transaction id

      const offerings = await Purchases.getOfferings().catch(() => null);
      const allPackages = [];

      try {
        const currentPkgs = offerings?.current?.availablePackages;
        if (Array.isArray(currentPkgs)) {
          allPackages.push(...currentPkgs);
        }

        const allOfferings = offerings?.all;
        if (allOfferings && typeof allOfferings === "object") {
          for (const key of Object.keys(allOfferings)) {
            const off = allOfferings[key];
            const pkgs = off?.availablePackages;
            if (Array.isArray(pkgs)) {
              allPackages.push(...pkgs);
            }
          }
        }
      } catch {
        // ignore
      }

      const uniqPackages = allPackages.filter(Boolean);

      const pkgMatch = uniqPackages.find((pkg) => {
        const pid = getRCProductId(pkg?.product);
        return pid === preferredId;
      });

      if (pkgMatch && typeof Purchases.purchasePackage === "function") {
        purchaseResult = await Purchases.purchasePackage(pkgMatch);
        purchaseCustomerInfo =
          purchaseResult?.customerInfo || purchaseResult?.purchaserInfo || null;
        purchased = true;
      }

      if (!purchased) {
        // Fallback: direct product purchase (StoreProduct)
        // IMPORTANT: date credits are a CONSUMABLE (non-subscription) IAP.
        const nonSubCategory = PRODUCT_CATEGORY?.NON_SUBSCRIPTION || null;

        let storeProducts = [];

        // First try just the preferred id (avoids odd failures when passing unknown legacy ids)
        try {
          storeProducts = nonSubCategory
            ? await Purchases.getProducts([preferredId], nonSubCategory)
            : await Purchases.getProducts([preferredId]);
        } catch (e) {
          // If that failed, try again with the full fallback list.
          storeProducts = nonSubCategory
            ? await Purchases.getProducts(
                DATE_CREDIT_PRODUCT_IDS,
                nonSubCategory,
              )
            : await Purchases.getProducts(DATE_CREDIT_PRODUCT_IDS);
        }

        const storeProductsArray = Array.isArray(storeProducts)
          ? storeProducts
          : [];

        const preferred = storeProductsArray.find(
          (p) => getRCProductId(p) === preferredId,
        );

        const storeProduct = preferred || storeProductsArray[0] || null;

        if (!storeProduct) {
          if (isDevRuntime) {
            Alert.alert(
              "Test purchase not set up",
              "This dev build can't complete a real purchase for date credits yet. You can add a test credit instead.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Add test credit", onPress: devGrantOneCredit },
              ],
            );
            return;
          }

          throw new Error(
            `Date credit product not found (tried: ${preferredId})`,
          );
        }

        if (typeof Purchases.purchaseStoreProduct === "function") {
          purchaseResult = await Purchases.purchaseStoreProduct(storeProduct);
          purchaseCustomerInfo =
            purchaseResult?.customerInfo ||
            purchaseResult?.purchaserInfo ||
            null;
        } else if (typeof Purchases.purchaseProduct === "function") {
          purchaseResult = await Purchases.purchaseProduct(
            getRCProductId(storeProduct) || preferredId,
          );
          purchaseCustomerInfo =
            purchaseResult?.customerInfo ||
            purchaseResult?.purchaserInfo ||
            null;
        } else {
          throw new Error("Purchases SDK missing purchase method");
        }
      }

      // After purchase, refresh/link again in case RevenueCat updated/merged the user.
      await linkRevenueCatToUser(uid);

      // Aggressively try to get a transaction id for client-claim.
      // In some TestFlight builds, CustomerInfo can lag behind the purchase call.
      const extractTxnFromPurchaseResult = (res) => {
        try {
          if (!res) return null;
          const pid =
            res?.productIdentifier ||
            res?.productId ||
            res?.product_id ||
            res?.storeProductIdentifier ||
            null;
          const tx =
            res?.transactionIdentifier ||
            res?.transactionId ||
            res?.transaction_id ||
            res?.storeTransactionIdentifier ||
            res?.store_transaction_id ||
            res?.transaction?.transactionIdentifier ||
            res?.transaction?.transactionId ||
            res?.transaction?.identifier ||
            res?.storeTransaction?.transactionIdentifier ||
            res?.storeTransaction?.transactionId ||
            null;

          const productId = pid != null ? String(pid).trim() : "";
          const transactionId = tx != null ? String(tx).trim() : "";

          if (!productId || !transactionId) return null;
          return { productId, transactionId };
        } catch {
          return null;
        }
      };

      let latestTxn = extractTxnFromPurchaseResult(purchaseResult);

      let info = purchaseCustomerInfo;
      if (!latestTxn) {
        latestTxn = extractLatestTransactionIdFromCustomerInfo(info);
      }

      // Try to force RevenueCat to sync receipts, then re-check customer info a few times.
      if (!latestTxn) {
        try {
          if (typeof Purchases.syncPurchases === "function") {
            await Purchases.syncPurchases();
          }
        } catch (e) {
          console.warn("Purchases.syncPurchases failed", e);
        }

        for (let i = 0; i < 6 && !latestTxn; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, i === 0 ? 200 : 650));
          // eslint-disable-next-line no-await-in-loop
          const nextInfo = await Purchases.getCustomerInfo().catch(() => null);
          latestTxn = extractLatestTransactionIdFromCustomerInfo(nextInfo);
          info = nextInfo || info;
        }
      }

      let claimResult = null;

      if (latestTxn?.transactionId && latestTxn?.productId) {
        try {
          claimResult = await claimCreditFromClient({
            transactionId: latestTxn.transactionId,
            productId: latestTxn.productId,
          });
        } catch (e) {
          // Not fatal: we still fall back to polling, but keep messaging clear.
          console.error(e);
          setPurchaseNotice(
            "Purchase complete — we're still processing your credit. No need to buy again.",
          );
        }
      } else {
        setPurchaseNotice(
          "Purchase complete — we're still processing your credit. No need to buy again.",
        );
      }

      // If claim succeeded and credits are now > baseline, finish immediately.
      const claimedCredits = Number(claimResult?.response?.credits);
      const claimedBalance = Number(claimResult?.response?.balanceCents);
      const claimWorked = Boolean(claimResult?.ok);

      const claimCreditsIncreased =
        Number.isFinite(claimedCredits) && claimedCredits > baselineCredits;
      const claimBalanceIncreased =
        Number.isFinite(claimedBalance) && claimedBalance > baselineBalance;

      if (claimWorked && (claimCreditsIncreased || claimBalanceIncreased)) {
        setPurchaseCompleted(true);
        setPurchaseSyncing(false);
        setPurchaseNotice("✅ Credit added");

        setTimeout(() => {
          try {
            goBack({ purchaseState: "success" });
          } catch (e) {
            console.error(e);
          }
        }, 350);

        return;
      }

      // If we got here without throwing, the purchase succeeded.
      setPurchaseCompleted(true);

      setPurchaseNotice(
        (prev) => prev || "Purchase received — updating your credits…",
      );
      setPurchaseSyncing(true);

      // Tight polling: keep this within ~5 seconds.
      let tries = 0;
      const maxTries = 10;

      const poll = async () => {
        tries += 1;

        let next = null;
        try {
          if (uid) {
            next = await refresh(uid);
          }
        } catch (e) {
          console.error(e);
        }

        const nextCredits = Number(next?.credits ?? baselineCredits);
        const nextBalance = Number(next?.balanceCents ?? baselineBalance);

        const creditsIncreased = nextCredits > baselineCredits;
        const balanceIncreased = nextBalance > baselineBalance;

        if (creditsIncreased || balanceIncreased) {
          setPurchaseSyncing(false);
          setPurchaseNotice("✅ Credit added");

          setTimeout(() => {
            try {
              goBack({ purchaseState: "success" });
            } catch (e) {
              console.error(e);
            }
          }, 450);

          return;
        }

        if (tries < maxTries) {
          setTimeout(poll, 500);
          return;
        }

        // At this point, we don't keep the user stuck waiting.
        setPurchaseSyncing(false);
        setPurchaseNotice(
          "Purchase received — still processing. Matches will unlock automatically.",
        );
      };

      setTimeout(poll, 250);
    } catch (e) {
      const cancelled = e?.userCancelled || e?.code === "PURCHASE_CANCELLED";
      if (cancelled) {
        return;
      }

      console.error(e);
      setPurchaseSyncing(false);

      const code = e?.code != null ? String(e.code) : "";
      const msg = e?.message != null ? String(e.message) : "";
      const details = [code, msg].filter(Boolean).join(" — ");

      setPurchaseNotice(
        details
          ? `Purchase failed — ${details}`
          : "Purchase failed — try again.",
      );

      Alert.alert(
        "Error",
        details
          ? `Could not complete purchase. ${details}`
          : "Could not complete purchase. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }, [
    balanceCents,
    busy,
    credits,
    devGrantOneCredit,
    isDevRuntime,
    linkRevenueCatToUser,
    refresh,
    stockedUp,
    userId,
    setUserId,
    goBack,
    claimCreditFromClient,
    jwt,
  ]);

  return {
    busy,
    purchaseNotice,
    purchaseSyncing,
    purchaseCompleted,
    setPurchaseNotice,
    setPurchaseSyncing,
    startPurchase,
    priceText,
    priceLoading,
  };
}
