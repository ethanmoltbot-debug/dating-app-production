import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";

export function useConversationScreen({
  matchId,
  user,
  matchInfo,
  tier,
  perkState,
  reloadMessages,
  refetchDrink,
  pingLocationMutation,
  setMessages,
}) {
  const [activeTab, setActiveTab] = useState("chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const [unmatchOpen, setUnmatchOpen] = useState(false);
  const [dateEditIntent, setDateEditIntent] = useState(0);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [preChatPromptDismissed, setPreChatPromptDismissed] = useState(false);
  const [creditModalIntent, setCreditModalIntent] = useState(null);
  const pendingMoveAfterCommitRef = useRef(false);
  const [consentStatus, setConsentStatus] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [moveBusy, setMoveBusy] = useState(false);
  const drinkSheetRef = useRef(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const autoOpenedDrinkRef = useRef(false);

  useEffect(() => {
    setPreChatPromptDismissed(false);
  }, [matchId]);

  const refreshConsent = useCallback(async () => {
    if (!matchId) return;
    const uid = Number(user?.id);
    if (!Number.isFinite(uid)) return;

    setConsentLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("userId", String(uid));
      if (tier) {
        qs.set("tier", String(tier));
      }

      const resp = await fetch(
        `/api/conversations/consent/${encodeURIComponent(String(matchId))}?${qs.toString()}`,
      );
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `When fetching /api/conversations/consent/${matchId}, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      const data = await resp.json();
      setConsentStatus(data?.status || null);
    } catch (e) {
      console.error(e);
      setConsentStatus(null);
    } finally {
      setConsentLoading(false);
    }
  }, [matchId, tier, user?.id]);

  useEffect(() => {
    refreshConsent();
  }, [refreshConsent]);

  useEffect(() => {
    if (!matchId) return;
    if (!Number.isFinite(Number(user?.id))) return;

    const state = String(perkState || "LOCKED");
    const shouldCare = state === "ARMED" || state === "READY";
    if (!shouldCare) return;

    let alive = true;

    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!alive) return;
        const granted = perm?.status === "granted";
        if (granted) {
          setLocationEnabled(true);
        }
      } catch (e) {
        console.error("[DrinkOnUs] permission check failed", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [matchId, perkState, user?.id]);

  useEffect(() => {
    if (!matchId) return;
    autoOpenedDrinkRef.current = false;
  }, [matchId]);

  // Prevent duplicate /api/messages calls:
  // - useConversation() already loads messages on mount
  // - we only want a reload when the user *returns* to the chat tab
  const hasMountedRef = useRef(false);
  const lastReloadAtRef = useRef(0);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (activeTab !== "chat") return;

    const now = Date.now();
    // throttle reloads (tab switching + other events can cause bursts)
    if (now - lastReloadAtRef.current < 1500) {
      return;
    }

    lastReloadAtRef.current = now;
    reloadMessages?.();
  }, [activeTab, reloadMessages]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    if (!matchId) return;
    if (!locationEnabled) return;

    const state = String(perkState || "LOCKED");
    const shouldPing = state === "ARMED" || state === "READY";
    if (!shouldPing) return;

    let alive = true;

    const pingOnce = async () => {
      if (!alive) return;
      if (!Number.isFinite(Number(user?.id))) return;

      try {
        const perm = await Location.getForegroundPermissionsAsync();
        const granted = perm?.status === "granted";
        if (!granted) {
          setLocationEnabled(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = pos?.coords;
        const lat = coords?.latitude;
        const lng = coords?.longitude;
        const accuracyM = coords?.accuracy;

        if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
          return;
        }

        await pingLocationMutation.mutateAsync({
          lat: Number(lat),
          lng: Number(lng),
          accuracyM: accuracyM != null ? Number(accuracyM) : null,
        });

        await refetchDrink();
      } catch (e) {
        console.error("[DrinkOnUs] location ping failed", e);
      }
    };

    pingOnce();

    const interval = setInterval(pingOnce, 20_000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [
    activeTab,
    locationEnabled,
    matchId,
    perkState,
    pingLocationMutation,
    refetchDrink,
    user?.id,
  ]);

  const toggleLike = useCallback(
    async (message) => {
      if (!matchId) return;

      const uid = Number(user?.id);
      const mid = Number(message?.id);
      if (!Number.isFinite(uid) || !Number.isFinite(mid)) return;

      const liked = Boolean(message?.liked_by_me);
      const prevCount = Math.max(0, Number(message?.like_count || 0));

      setMessages((prev) =>
        (prev || []).map((m) => {
          if (Number(m?.id) !== mid) return m;
          const nextCount = Math.max(0, prevCount + (liked ? -1 : 1));
          return { ...m, liked_by_me: !liked, like_count: nextCount };
        }),
      );

      try {
        const resp = await fetch(`/api/messages/${matchId}/likes/${mid}`, {
          method: liked ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid }),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(
            `When updating /api/messages/${matchId}/likes/${mid}, the response was [${resp.status}] ${resp.statusText}. ${text}`,
          );
        }

        const data = await resp.json();
        setMessages((prev) =>
          (prev || []).map((m) => {
            if (Number(m?.id) !== mid) return m;
            return {
              ...m,
              like_count: Math.max(0, Number(data?.like_count || 0)),
              liked_by_me: Boolean(data?.liked_by_me),
            };
          }),
        );
      } catch (e) {
        console.error(e);

        setMessages((prev) =>
          (prev || []).map((m) => {
            if (Number(m?.id) !== mid) return m;
            return { ...m, liked_by_me: liked, like_count: prevCount };
          }),
        );

        Alert.alert("Could not update", "Please try again.");
      }
    },
    [matchId, setMessages, user?.id],
  );

  const requestDateChange = useCallback(() => {
    setActiveTab("date");
    setDateEditIntent(Date.now());
  }, []);

  const openDrinkSheet = useCallback(async () => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      const granted = perm?.status === "granted";
      setLocationEnabled(Boolean(granted));
    } catch (e) {
      console.error(e);
    }

    drinkSheetRef.current?.snapToIndex(0);
  }, []);

  const requestDrinkLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationEnabled(status === "granted");
      await refetchDrink();
    } catch (e) {
      console.error(e);
      setLocationEnabled(false);
    }
  }, [refetchDrink]);

  const planDateFromDrink = useCallback(() => {
    drinkSheetRef.current?.close();
    requestDateChange();
  }, [requestDateChange]);

  const startUnlock = useCallback(() => {
    drinkSheetRef.current?.close();
    setUnlockOpen(true);
  }, []);

  const onUnlocked = useCallback(() => {
    refetchDrink();
  }, [refetchDrink]);

  const handleMoveToChat = useCallback(
    async (router) => {
      if (!matchId) return;
      const uid = Number(user?.id);
      if (!Number.isFinite(uid)) return;

      if (moveBusy) return;

      setMoveBusy(true);

      try {
        const resp = await fetch(
          `/api/conversations/consent/${encodeURIComponent(String(matchId))}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: uid, tier }),
          },
        );

        if (!resp.ok) {
          if (resp.status === 410) {
            Alert.alert(
              "No longer available",
              "This match is no longer available.",
            );
            router.replace("/messages");
            return;
          }

          if (resp.status === 402) {
            const data = await resp.json().catch(() => null);
            const missing = Array.isArray(data?.missingUserIds)
              ? data.missingUserIds
                  .map((v) => Number(v))
                  .filter((n) => Number.isFinite(n))
              : [];

            const iAmMissing = missing.includes(uid);

            if (iAmMissing) {
              pendingMoveAfterCommitRef.current = true;
              setCreditModalIntent("move");
              setCreditModalOpen(true);
              return;
            }

            Alert.alert(
              "Waiting on them",
              "This chat starts after both of you add a date credit.",
            );
            return;
          }

          if (resp.status === 409) {
            const data = await resp.json().catch(() => null);
            const status = data?.status || null;
            if (status) {
              setConsentStatus(status);
            }

            const limit = Number(status?.myActiveChatLimit);
            const count = Number(status?.myActiveChatCount);

            const hasLimit = Number.isFinite(limit) && limit > 0;
            const limitWord = hasLimit && limit === 1 ? "chat" : "chats";

            const message = hasLimit
              ? `You can only have ${limit} active ${limitWord} at a time. End one first, then try again.`
              : "You're already at your active chat limit. End an active chat first, then try again.";

            const title =
              Number.isFinite(count) && hasLimit
                ? `Active chat limit (${count}/${limit})`
                : "Active chat limit";

            Alert.alert(title, message);
            return;
          }

          const text = await resp.text().catch(() => "");
          throw new Error(
            `When posting /api/conversations/consent/${matchId}, the response was [${resp.status}] ${resp.statusText}. ${text}`,
          );
        }

        const data = await resp.json();
        setConsentStatus(data?.status || null);

        try {
          await reloadMessages?.();
        } catch (e) {
          console.error(e);
        }

        const isActive = Boolean(data?.status?.isActive);
        if (isActive) {
          Alert.alert("Chat started", "You're now in an active chat.");
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Could not move to chat", "Please try again.");
      } finally {
        setMoveBusy(false);
      }
    },
    [matchId, moveBusy, reloadMessages, tier, user?.id],
  );

  return {
    activeTab,
    setActiveTab,
    menuOpen,
    setMenuOpen,
    unmatchOpen,
    setUnmatchOpen,
    dateEditIntent,
    creditModalOpen,
    setCreditModalOpen,
    preChatPromptDismissed,
    setPreChatPromptDismissed,
    creditModalIntent,
    setCreditModalIntent,
    pendingMoveAfterCommitRef,
    consentStatus,
    setConsentStatus,
    consentLoading,
    moveBusy,
    drinkSheetRef,
    unlockOpen,
    setUnlockOpen,
    locationEnabled,
    setLocationEnabled,
    autoOpenedDrinkRef,
    refreshConsent,
    toggleLike,
    requestDateChange,
    openDrinkSheet,
    requestDrinkLocation,
    planDateFromDrink,
    startUnlock,
    onUnlocked,
    handleMoveToChat,
  };
}
