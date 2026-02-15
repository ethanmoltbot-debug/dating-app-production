import { useCallback, useMemo, useState } from "react";
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";

function Pill({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? "rgba(124,58,237,0.35)" : "rgba(17,17,17,0.10)",
        backgroundColor: selected
          ? "rgba(124,58,237,0.12)"
          : "rgba(255,255,255,0.75)",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: selected ? "700" : "500", // answers less bold than questions
          color: "#111",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function toTitleCase(input) {
  const str = String(input || "").trim();
  if (!str) return "";

  return str
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      // keep very short words lowercased unless they're the first word
      // (simple heuristic; avoids "Of", "And" looking weird)
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export default function DateFeedbackModal({
  visible,
  insets,
  matchId,
  otherName,
  userId,
  onSubmitted,
}) {
  // NOTE: keep this popup dependency-light; system fonts are used for stability.

  // NEW: Structured post-date questions
  const [timeSpent, setTimeSpent] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [goAgain, setGoAgain] = useState(null);
  const [noReason, setNoReason] = useState(null);

  // replace didSubmit with a small "submit flow" state
  // idle -> sending (spinner) -> success (animated check)
  const [submitStage, setSubmitStage] = useState("idle");
  const closeTimerRef = useRef(null);
  const stageTimerRef = useRef(null);

  const checkScale = useRef(new Animated.Value(0.85)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (stageTimerRef.current) {
        clearTimeout(stageTimerRef.current);
        stageTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const isSuccess = submitStage === "success";
    if (!isSuccess) {
      return;
    }

    // simple "pop" animation for the check
    checkScale.setValue(0.85);
    checkOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [submitStage, checkOpacity, checkScale]);

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

  const timeSpentOptions = useMemo(
    () => [
      { key: "LT_10", label: "Less than 10 minutes" },
      { key: "MIN10_30", label: "10–30 minutes" },
      { key: "MIN30_90", label: "30–90 minutes" },
      { key: "MIN90_PLUS", label: "90+ minutes" },
    ],
    [],
  );

  const engagementOptions = useMemo(
    () => [
      { key: "YES", label: "Yes" },
      { key: "SOMEWHAT", label: "Somewhat" },
      { key: "NO", label: "No" },
    ],
    [],
  );

  const goAgainOptions = useMemo(
    () => [
      { key: "YES", label: "Yes" },
      { key: "MAYBE", label: "Maybe" },
      { key: "NO", label: "No" },
    ],
    [],
  );

  const noReasonOptions = useMemo(
    () => [
      { key: "NO_CONNECTION", label: "I didn’t feel a connection" },
      { key: "CONVO_DIDNT_FLOW", label: "The conversation didn’t flow" },
      {
        key: "NOT_ALIGNED",
        label: "They didn’t seem aligned with what they said they wanted",
      },
      { key: "UNCOMFORTABLE", label: "Something made me uncomfortable" },
    ],
    [],
  );

  const requiresNoReason = goAgain === "NO";

  const canSubmit = useMemo(() => {
    const okIds =
      Number.isFinite(Number(matchId)) && Number.isFinite(Number(userId));

    const hasCoreAnswers =
      Boolean(timeSpent) && Boolean(engagement) && Boolean(goAgain);
    const hasFollowup = requiresNoReason ? Boolean(noReason) : true;

    return okIds && hasCoreAnswers && hasFollowup && !submitting;
  }, [
    engagement,
    goAgain,
    matchId,
    noReason,
    requiresNoReason,
    submitting,
    timeSpent,
    userId,
  ]);

  const resetLocalState = useCallback(() => {
    setTimeSpent(null);
    setEngagement(null);
    setGoAgain(null);
    setNoReason(null);
    setSubmitStage("idle");
    setSubmitting(false);
    setError(null);

    // reset animations so the next time the modal shows, it plays again cleanly
    checkScale.setValue(0.85);
    checkOpacity.setValue(0);
  }, [checkOpacity, checkScale]);

  const submit = useCallback(async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        userId: Number(userId),
        timeSpent,
        engagement,
        goAgain,
        noReason: requiresNoReason ? noReason : null,
      };

      const resp = await fetch(`/api/matches/${matchId}/date/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `When posting /api/matches/${matchId}/date/feedback, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }

      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch (e) {
        console.error(e);
      }

      // Show a confirmation sequence:
      // 1) spinner + "Submitting" briefly
      // 2) animated check + "Review submitted"
      setSubmitStage("sending");

      const CHECK_DELAY_MS = 650;
      const DISMISS_AFTER_MS = 2600;

      if (stageTimerRef.current) {
        clearTimeout(stageTimerRef.current);
      }
      stageTimerRef.current = setTimeout(() => {
        setSubmitStage("success");
      }, CHECK_DELAY_MS);

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => {
        onSubmitted?.({ matchId: Number(matchId) });
        resetLocalState();
      }, DISMISS_AFTER_MS);
    } catch (e) {
      console.error(e);
      setError("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    engagement,
    goAgain,
    matchId,
    noReason,
    onSubmitted,
    requiresNoReason,
    resetLocalState,
    timeSpent,
    userId,
  ]);

  const safePadTop = insets?.top || 0;
  const safePadBottom = insets?.bottom || 0;
  const otherRaw = otherName || "your match";
  const prettyOther = toTitleCase(otherRaw);
  const prettyName = String(prettyOther || "").toUpperCase();
  const nameFontFamily = Platform.OS === "ios" ? "Georgia" : "serif";

  const isSubmitted = submitStage !== "idle";
  const isSending = submitStage === "sending";
  const isSuccess = submitStage === "success";

  if (!visible) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* dimmer */}
      <View
        pointerEvents="auto"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.30)",
        }}
      />

      {/* popup card */}
      <View
        pointerEvents="box-none"
        style={{
          flex: 1,
          paddingTop: safePadTop,
          paddingBottom: safePadBottom,
          paddingHorizontal: 14,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LinearGradient
          colors={BG_GRADIENT}
          style={{
            width: "100%",
            maxWidth: 520,
            borderRadius: 22,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.55)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
          }}
        >
          <View
            style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12 }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: "#111",
                textAlign: "center",
              }}
            >
              Rate your date with
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 30,
                fontWeight: "900",
                fontFamily: nameFontFamily,
                color: "#111",
                textAlign: "center",
                letterSpacing: 1.2,
              }}
              numberOfLines={2}
            >
              {prettyName}
            </Text>
          </View>

          {isSubmitted ? (
            <View
              style={{
                paddingHorizontal: 18,
                paddingBottom: 22,
                paddingTop: 10,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: "100%",
                  backgroundColor: "rgba(255,255,255,0.86)",
                  borderRadius: 22,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.06)",
                  alignItems: "center",
                }}
              >
                {isSending ? (
                  <View style={{ alignItems: "center" }}>
                    <ActivityIndicator color="#7C3AED" />
                    <Text
                      style={{
                        marginTop: 10,
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#6B7280",
                        textAlign: "center",
                      }}
                    >
                      Submitting…
                    </Text>
                  </View>
                ) : null}

                {isSuccess ? (
                  <View style={{ alignItems: "center" }}>
                    <Animated.View
                      style={{
                        opacity: checkOpacity,
                        transform: [{ scale: checkScale }],
                        width: 62,
                        height: 62,
                        borderRadius: 31,
                        backgroundColor: "rgba(124,58,237,0.12)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={34} color="#7C3AED" strokeWidth={3} />
                    </Animated.View>

                    <Text
                      style={{
                        marginTop: 14,
                        fontSize: 18,
                        fontWeight: "900",
                        color: "#111",
                        textAlign: "center",
                      }}
                    >
                      Review submitted
                    </Text>
                    <Text
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#6B7280",
                        textAlign: "center",
                        lineHeight: 18,
                      }}
                    >
                      Thanks — this helps keep the community high quality.
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 520 }}
              contentContainerStyle={{
                paddingHorizontal: 18,
                paddingBottom: 18,
              }}
              showsVerticalScrollIndicator={false}
            >
              {error ? (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: "#B91C1C",
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.86)",
                  borderRadius: 22,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.06)",
                }}
              >
                {/* 1) Time spent */}
                {/* Removed section header; keep only the question text */}
                <Text
                  style={{
                    fontSize: 13,
                    color: "#111",
                    fontWeight: "800",
                  }}
                >
                  About how long did you spend together?
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}
                >
                  {timeSpentOptions.map((o) => (
                    <Pill
                      key={o.key}
                      label={o.label}
                      selected={timeSpent === o.key}
                      onPress={() => setTimeSpent(o.key)}
                    />
                  ))}
                </View>

                {/* 2) Engagement */}
                <View style={{ marginTop: 18 }}>
                  {/* Removed section header; keep only the question text */}
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#111",
                      fontWeight: "800",
                    }}
                  >
                    Did this person make a reasonable effort to engage during
                    the date?
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      marginTop: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {engagementOptions.map((o) => (
                      <Pill
                        key={o.key}
                        label={o.label}
                        selected={engagement === o.key}
                        onPress={() => setEngagement(o.key)}
                      />
                    ))}
                  </View>
                </View>

                {/* 3) Would you go again */}
                <View style={{ marginTop: 18 }}>
                  {/* Removed section header; keep only the question text */}
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#111",
                      fontWeight: "800",
                    }}
                  >
                    Would you go on another date with this person?
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      marginTop: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {goAgainOptions.map((o) => (
                      <Pill
                        key={o.key}
                        label={o.label}
                        selected={goAgain === o.key}
                        onPress={() => {
                          setGoAgain(o.key);
                          if (o.key !== "NO") {
                            setNoReason(null);
                          }
                        }}
                      />
                    ))}
                  </View>
                </View>

                {/* 4) Conditional follow-up */}
                {requiresNoReason ? (
                  <View style={{ marginTop: 18 }}>
                    {/* Keep follow-up question only (no extra header) */}
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#111",
                        fontWeight: "800",
                      }}
                    >
                      What best explains why you wouldn’t go on another date?
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        marginTop: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {noReasonOptions.map((o) => (
                        <Pill
                          key={o.key}
                          label={o.label}
                          selected={noReason === o.key}
                          onPress={() => setNoReason(o.key)}
                        />
                      ))}
                    </View>

                    {/* Remove the FYI line too? leaving it is optional; per request only asked to remove headers + required text */}
                    <Text
                      style={{ marginTop: 10, fontSize: 11, color: "#6B7280" }}
                    >
                      If you choose “uncomfortable”, we may flag it for review
                      if it repeats.
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={submit}
                disabled={!canSubmit || isSubmitted}
                activeOpacity={0.9}
                style={{
                  marginTop: 14,
                  borderRadius: 16,
                  overflow: "hidden",
                  opacity: canSubmit ? 1 : 0.65,
                }}
              >
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 14, alignItems: "center" }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}
                    >
                      Submit
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={{ marginTop: 10, fontSize: 11, color: "#6B7280" }}>
                Thanks — your answers help keep the community high quality.
              </Text>
            </ScrollView>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}
