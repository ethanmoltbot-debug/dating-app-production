import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

async function fetchJson(url, options) {
  const resp = await fetch(url, options);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `When fetching ${url}, the response was [${resp.status}] ${resp.statusText}. ${text}`,
    );
  }
  return resp.json();
}

export function DrinkUnlockModal({
  visible,
  onClose,
  matchId,
  userId,
  onUnlocked,
}) {
  const [mode, setMode] = useState("intro"); // intro | waiting | success
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [credit, setCredit] = useState(null);

  // NEW: a separate "checking" flag so the waiting screen can show a manual refresh spinner
  const [checking, setChecking] = useState(false);

  // NEW: track if the other person already tapped start
  const [session, setSession] = useState(null);

  const anim = useRef(new Animated.Value(0)).current;

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"]; // lavender -> icy blue -> blush
  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"]; // pink -> purple

  useEffect(() => {
    if (!visible) return;

    // reset when opened
    setMode("intro");
    setError(null);
    setBusy(false);
    setChecking(false);
    setCredit(null);
    setSession(null);
  }, [visible]);

  const canStart = useMemo(() => {
    return Boolean(matchId) && Number.isFinite(Number(userId));
  }, [matchId, userId]);

  // NEW: small helper to check status once (used by polling + manual refresh)
  const checkStatusOnce = useCallback(async () => {
    if (!matchId || !userId) return;

    const data = await fetchJson(
      `/api/drink-perk/${matchId}/handshake/status?userId=${Number(userId)}`,
    );

    setSession(data?.session || null);

    const c = data?.credit || null;
    if (c?.token) {
      setCredit(c);
      setMode("success");
      onUnlocked?.(c);
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch (e) {
        console.error(e);
      }
    }
  }, [matchId, onUnlocked, userId]);

  // Poll for completion while waiting.
  useEffect(() => {
    if (!visible) return;
    if (mode !== "waiting") return;

    let alive = true;

    // NEW: check immediately when we enter waiting (so admin/dev simulation feels instant)
    (async () => {
      try {
        await checkStatusOnce();
      } catch (e) {
        console.error(e);
      }
    })();

    const timer = setInterval(async () => {
      if (!alive) return;
      try {
        await checkStatusOnce();
      } catch (e) {
        // keep waiting; do not show noisy error
        console.error(e);
      }
    }, 900);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [checkStatusOnce, mode, visible]);

  // NEW: even on the intro screen, if a credit already exists (e.g. the other phone unlocked first)
  // we should surface it instead of making the user tap start again.
  useEffect(() => {
    if (!visible) return;
    if (mode !== "intro") return;
    if (!matchId || !userId) return;

    let alive = true;

    const t = setTimeout(async () => {
      if (!alive) return;
      try {
        await checkStatusOnce();
      } catch (e) {
        console.error(e);
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [checkStatusOnce, matchId, mode, userId, visible]);

  // "Phones together" animation loop while waiting.
  useEffect(() => {
    if (!visible) return;
    if (mode !== "waiting") return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 780,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 780,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      anim.setValue(0);
    };
  }, [anim, mode, visible]);

  const startTogether = useCallback(async () => {
    if (!canStart) return;

    setBusy(true);
    setError(null);

    try {
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        console.error(e);
      }

      // Auto-join: both phones just tap start. No code needed.
      const data = await fetchJson(
        `/api/drink-perk/${matchId}/handshake/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: Number(userId), autoJoin: true }),
        },
      );

      if (data?.credit?.token) {
        setCredit(data.credit);
        setMode("success");
        onUnlocked?.(data.credit);
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } catch (e) {
          console.error(e);
        }
        return;
      }

      // waiting for other phone
      setMode("waiting");

      // NEW: if admin/dev already completed it, surface success immediately
      try {
        await checkStatusOnce();
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Could not start");
    } finally {
      setBusy(false);
    }
  }, [canStart, checkStatusOnce, matchId, onUnlocked, userId]);

  // NEW: manual refresh button for when dev tools complete the handshake
  const manualRefresh = useCallback(async () => {
    if (!matchId || !userId) return;
    setChecking(true);
    try {
      await checkStatusOnce();
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  }, [checkStatusOnce, matchId, userId]);

  const copyCredit = useCallback(async () => {
    if (!credit?.token) return;
    try {
      await Clipboard.setStringAsync(String(credit.token));
      try {
        await Haptics.selectionAsync();
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      console.error(e);
    }
  }, [credit?.token]);

  const closeSafe = useCallback(() => {
    setMode("intro");
    setError(null);
    onClose?.();
  }, [onClose]);

  const leftX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-26, -6],
  });
  const rightX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 6],
  });
  const glowScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.05],
  });
  const glowOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.4],
  });

  const expiresLabel = useMemo(() => {
    if (!credit?.expiresAt) return null;
    const d = new Date(credit.expiresAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString();
  }, [credit?.expiresAt]);

  const tokenPreview = useMemo(() => {
    const t = String(credit?.token || "");
    if (!t) return null;
    if (t.length <= 18) return t;
    return `${t.slice(0, 10)}…${t.slice(-6)}`;
  }, [credit?.token]);

  const otherHasTappedStart = useMemo(() => {
    const s = session;
    if (!s) return false;
    const initiatorId = Number(s?.initiatorUserId);
    const uid = Number(userId);
    if (!Number.isFinite(initiatorId) || !Number.isFinite(uid)) return false;
    return initiatorId !== uid;
  }, [session, userId]);

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      onRequestClose={closeSafe}
    >
      <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
        <View
          style={{
            paddingTop: 58,
            paddingHorizontal: 18,
            paddingBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#111" }}>
              Drink on Us
            </Text>
            <TouchableOpacity onPress={closeSafe} style={{ padding: 10 }}>
              <Text style={{ color: "#111", fontWeight: "900" }}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ marginTop: 8, fontSize: 13, color: "#6B7280" }}>
            Hold both phones together and tap start on both.
          </Text>
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
            <Text style={{ color: "#B91C1C", fontSize: 12, fontWeight: "700" }}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 18 }}>
          {mode === "intro" ? (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.86)",
                  borderRadius: 24,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.06)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 14 },
                  shadowOpacity: 0.12,
                  shadowRadius: 22,
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "900", color: "#111" }}
                >
                  Tap to start
                </Text>
                <Text
                  style={{
                    marginTop: 10,
                    color: "#6B7280",
                    fontSize: 13,
                    lineHeight: 18,
                  }}
                >
                  This unlocks a drink credit for you both.
                </Text>

                {otherHasTappedStart ? (
                  <View
                    style={{
                      marginTop: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      backgroundColor: "rgba(255, 237, 213, 0.9)",
                      borderWidth: 1,
                      borderColor: "#FED7AA",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "900",
                        color: "#9A3412",
                      }}
                    >
                      They’re on the unlock screen now.
                    </Text>
                    <Text
                      style={{ marginTop: 4, fontSize: 12, color: "#9A3412" }}
                    >
                      Tap start to unlock together.
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={startTogether}
                  disabled={busy || !canStart}
                  activeOpacity={0.9}
                  style={{
                    marginTop: 16,
                    borderRadius: 16,
                    overflow: "hidden",
                    opacity: busy || !canStart ? 0.7 : 1,
                  }}
                >
                  <LinearGradient
                    colors={CTA_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 14, alignItems: "center" }}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "900",
                          fontSize: 16,
                        }}
                      >
                        Tap to start
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {!canStart ? (
                  <Text
                    style={{ marginTop: 10, fontSize: 12, color: "#6B7280" }}
                  >
                    Missing match info — close and re-open the chat.
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {mode === "waiting" ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Animated.View
                style={{
                  width: 190,
                  height: 190,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,79,216,0.20)",
                  transform: [{ scale: glowScale }],
                  opacity: glowOpacity,
                }}
              />

              <View style={{ position: "absolute", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Animated.View
                    style={{
                      width: 64,
                      height: 110,
                      borderRadius: 16,
                      backgroundColor: "rgba(255,255,255,0.92)",
                      borderWidth: 1,
                      borderColor: "rgba(17,17,17,0.08)",
                      transform: [{ translateX: leftX }],
                    }}
                  />
                  <View style={{ width: 14 }} />
                  <Animated.View
                    style={{
                      width: 64,
                      height: 110,
                      borderRadius: 16,
                      backgroundColor: "rgba(255,255,255,0.92)",
                      borderWidth: 1,
                      borderColor: "rgba(17,17,17,0.08)",
                      transform: [{ translateX: rightX }],
                    }}
                  />
                </View>

                <View style={{ marginTop: 18, alignItems: "center" }}>
                  <ActivityIndicator color="#7C3AED" />
                  <Text
                    style={{ marginTop: 10, fontWeight: "900", color: "#111" }}
                  >
                    Holding together…
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      color: "#6B7280",
                      fontSize: 12,
                      textAlign: "center",
                      maxWidth: 280,
                      lineHeight: 16,
                    }}
                  >
                    Waiting for the other phone to tap start.
                  </Text>
                </View>

                <View style={{ marginTop: 16, alignItems: "center", gap: 10 }}>
                  <TouchableOpacity
                    onPress={startTogether}
                    disabled={busy}
                    activeOpacity={0.9}
                    style={{
                      borderRadius: 14,
                      overflow: "hidden",
                      opacity: busy ? 0.75 : 1,
                    }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255,79,216,0.95)",
                        "rgba(124,58,237,0.95)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 18,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "900" }}>
                        Re-try start
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* NEW: manual refresh for dev/admin simulations */}
                  <TouchableOpacity
                    onPress={manualRefresh}
                    disabled={checking}
                    activeOpacity={0.9}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      backgroundColor: "rgba(17,17,17,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(17,17,17,0.08)",
                      opacity: checking ? 0.7 : 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {checking ? <ActivityIndicator color="#111" /> : null}
                    <Text
                      style={{ color: "#111", fontWeight: "900", fontSize: 13 }}
                    >
                      Check unlock now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          {mode === "success" ? (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View
                style={{
                  borderRadius: 26,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: 0.14,
                  shadowRadius: 26,
                }}
              >
                <LinearGradient
                  colors={["#FF4FD8", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 1 }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.92)",
                      borderRadius: 25,
                      padding: 18,
                    }}
                  >
                    <Text
                      style={{ fontSize: 18, fontWeight: "900", color: "#111" }}
                    >
                      Unlocked ✅
                    </Text>
                    <Text
                      style={{
                        marginTop: 8,
                        color: "#6B7280",
                        fontSize: 13,
                        lineHeight: 18,
                      }}
                    >
                      Show this card at the bar to redeem your drink.
                    </Text>

                    <View
                      style={{
                        marginTop: 14,
                        backgroundColor: "rgba(17,17,17,0.04)",
                        borderRadius: 16,
                        padding: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          fontWeight: "800",
                        }}
                      >
                        Credit
                      </Text>
                      <Text
                        style={{
                          marginTop: 8,
                          fontSize: 20,
                          fontWeight: "900",
                          color: "#111",
                        }}
                      >
                        1 free drink
                      </Text>
                      {expiresLabel ? (
                        <Text
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#6B7280",
                          }}
                        >
                          Expires: {expiresLabel}
                        </Text>
                      ) : null}
                      {tokenPreview ? (
                        <Text
                          style={{
                            marginTop: 10,
                            fontSize: 12,
                            color: "#111",
                            fontWeight: "800",
                          }}
                        >
                          Code: {tokenPreview}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={{ marginTop: 14, flexDirection: "row", gap: 10 }}
                    >
                      <TouchableOpacity
                        onPress={copyCredit}
                        activeOpacity={0.9}
                        style={{
                          flex: 1,
                          borderRadius: 14,
                          overflow: "hidden",
                        }}
                      >
                        <LinearGradient
                          colors={CTA_GRADIENT}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ paddingVertical: 12, alignItems: "center" }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "900" }}>
                            Copy code
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(17,17,17,0.06)",
                          paddingVertical: 12,
                          borderRadius: 14,
                          alignItems: "center",
                          opacity: 0.55,
                        }}
                      >
                        <Text style={{ color: "#111", fontWeight: "900" }}>
                          Add to Apple Wallet
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text
                      style={{ marginTop: 10, fontSize: 11, color: "#6B7280" }}
                    >
                      Apple Wallet support is coming. For now, this in-app card
                      is the voucher.
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </Modal>
  );
}
