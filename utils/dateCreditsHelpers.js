import AsyncStorage from "@react-native-async-storage/async-storage";

export async function safeReadUserFromStorage() {
  try {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function safeWriteUserToStorage(nextUser) {
  try {
    await AsyncStorage.setItem("user", JSON.stringify(nextUser));
  } catch {
    // ignore
  }
}

export function formatMoney(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "$0";
  return `$${(n / 100).toFixed(0)}`;
}

export function normalizeReturnTo(raw, fallbackPath) {
  const fallback = fallbackPath || "/messages";
  if (!raw) return fallback;

  let s = String(raw || "").trim();
  if (!s) return fallback;

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

  // Strip expo-router route-group segment if a caller included it.
  if (base.startsWith("/(tabs)")) {
    base = base.slice("/(tabs)".length) || "/";
    if (!base.startsWith("/")) base = `/${base}`;
  }

  if (!base || base === "/") {
    base = fallback;
  }

  return query ? `${base}?${query}` : base;
}

// App Store Connect product id for the 1-credit consumable.
// Keep older ids as fallback so older builds / environments don't break.
// NOTE: "date_credit_pro" is the current ASC productId.
export const DATE_CREDIT_PRODUCT_IDS = [
  "date_credit_pro",
  "dating_credit_pro",
  "date_credit_1",
];

// Robust id extractor for StoreProduct / Package lookups
export function getRCProductId(p) {
  const id = p?.identifier || p?.productIdentifier;
  return id != null ? String(id) : "";
}

export function extractLatestTransactionIdFromCustomerInfo(info) {
  try {
    const candidates = [];

    // Common shapes: arrays
    const nonSub = info?.nonSubscriptionTransactions;
    if (Array.isArray(nonSub)) {
      for (const t of nonSub) {
        candidates.push(t);
      }
    }

    // Common typo/variant seen in some SDK versions
    const nonSubAlt = info?.nonSubscriptionsTransactions;
    if (Array.isArray(nonSubAlt)) {
      for (const t of nonSubAlt) {
        candidates.push(t);
      }
    }

    // Newer SDKs sometimes nest by product id.
    const nonSubByPid = info?.nonSubscriptionTransactionsByProductId;
    if (nonSubByPid && typeof nonSubByPid === "object") {
      for (const key of Object.keys(nonSubByPid)) {
        const arr = nonSubByPid[key];
        if (Array.isArray(arr)) {
          for (const t of arr) candidates.push(t);
        }
      }
    }

    // Fallback: deep scan the whole object for anything that looks like
    // { productIdentifier, transactionIdentifier, purchaseDate }.
    // This makes TestFlight more reliable across StoreKit/SDK variations.
    const deepScan = () => {
      const out = [];
      const seen = new Set();
      const stack = [{ v: info, depth: 0 }];
      const maxDepth = 7;

      while (stack.length) {
        const { v, depth } = stack.pop();
        if (!v || typeof v !== "object") continue;
        if (seen.has(v)) continue;
        seen.add(v);

        // If this object looks like a transaction, capture it.
        const pid = v?.productIdentifier || v?.productId || v?.product_id;
        const tx =
          v?.transactionIdentifier ||
          v?.transactionId ||
          v?.transaction_id ||
          v?.storeTransactionIdentifier ||
          v?.store_transaction_id;

        if (pid && tx) {
          out.push(v);
        }

        if (depth >= maxDepth) continue;

        // Traverse children
        if (Array.isArray(v)) {
          for (const child of v) {
            stack.push({ v: child, depth: depth + 1 });
          }
        } else {
          for (const key of Object.keys(v)) {
            const child = v[key];
            if (child && typeof child === "object") {
              stack.push({ v: child, depth: depth + 1 });
            }
          }
        }
      }

      return out;
    };

    if (candidates.length === 0 && info && typeof info === "object") {
      try {
        const deep = deepScan();
        for (const t of deep) candidates.push(t);
      } catch {
        // ignore
      }
    }

    const normalized = candidates
      .map((t) => {
        const pid = t?.productIdentifier || t?.productId || t?.product_id || "";
        const tx =
          t?.transactionIdentifier ||
          t?.transactionId ||
          t?.transaction_id ||
          t?.storeTransactionIdentifier ||
          t?.store_transaction_id ||
          "";
        const purchasedAt =
          t?.purchaseDate || t?.purchasedAt || t?.purchase_date || null;
        const ts = purchasedAt ? new Date(purchasedAt).getTime() : 0;
        return {
          productId: String(pid || "").trim(),
          transactionId: String(tx || "").trim(),
          ts: Number.isFinite(ts) ? ts : 0,
        };
      })
      .filter((t) => t.productId && t.transactionId);

    // Prefer our credit product ids, then newest.
    const filtered = normalized.filter((t) =>
      DATE_CREDIT_PRODUCT_IDS.includes(t.productId),
    );
    const list = filtered.length ? filtered : normalized;

    list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return list.length ? list[0] : null;
  } catch {
    return null;
  }
}
