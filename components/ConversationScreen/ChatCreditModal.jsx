import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

function formatMoney(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "$0";
  return `$${(n / 100).toFixed(0)}`;
}

async function fetchCreditStatus({ userId }) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) {
    throw new Error("Missing user id");
  }

  const resp = await fetch(`/api/date-credits/status?userId=${uid}`);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `When fetching /api/date-credits/status, the response was [${resp.status}] ${resp.statusText}. ${text}`,
    );
  }

  return resp.json();
}

// NEW: purchase-only date credit modal (no per-match commit)
export function ChatCreditModal({
  visible,
  onClose,
  matchId,
  userId,
  required = false,
  intent = "move", // 'move' | 'send'
}) {
  const router = useRouter();

  const [uiError, setUiError] = useState(null);

  const statusQuery = useQuery({
    queryKey: ["dateCreditsStatus", Number(userId)],
    enabled: Boolean(visible) && Number.isFinite(Number(userId)),
    queryFn: async () => fetchCreditStatus({ userId }),
    staleTime: 0,
  });

  useEffect(() => {
    if (!visible) return;
    setUiError(null);
    statusQuery.refetch().catch(() => null);
  }, [statusQuery, visible]);

  const requiredCents = Number(statusQuery.data?.requiredCents || 3000);
  const balanceCents = Number(statusQuery.data?.balanceCents || 0);
  const credits = Number(statusQuery.data?.credits || 0);

  const hasCredit = useMemo(() => {
    const c = Number(credits || 0);
    return Number.isFinite(c) && c > 0;
  }, [credits]);

  const headerLine = useMemo(() => {
    if (hasCredit) return "You’re set";
    return "Add a date credit";
  }, [hasCredit]);

  const bodyLine = useMemo(() => {
    const base =
      intent === "send"
        ? "You need a date credit to message in an active chat."
        : "You need a date credit to move this chat into Active.";

    return `${base} You can still view matches and send pre-chat messages without one.`;
  }, [intent]);

  const onPressPurchase = useCallback(() => {
    try {
      const qs = new URLSearchParams();
      const returnTo = matchId ? `/messages/${String(matchId)}` : "/messages";
      qs.set("returnTo", returnTo);
      router.push(`/date-credits?${qs.toString()}`);
    } catch (e) {
      console.error(e);
      router.push("/date-credits");
    }
  }, [matchId, router]);

  const closeSafe = useCallback(() => {
    if (required) {
      return;
    }
    onClose?.();
  }, [onClose, required]);

  const exitSafe = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      onRequestClose={required ? () => {} : closeSafe}
    >
      <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
        <View
          style={{ paddingTop: 58, paddingHorizontal: 18, paddingBottom: 14 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#111" }}>
              Date credit
            </Text>

            {!required ? (
              <TouchableOpacity onPress={closeSafe} style={{ padding: 10 }}>
                <Text style={{ color: "#111", fontWeight: "900" }}>Close</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44, height: 44 }} />
            )}
          </View>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 10 }}>
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
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              {headerLine}
            </Text>
            <Text
              style={{
                marginTop: 10,
                color: "#6B7280",
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {bodyLine}
            </Text>

            <View
              style={{
                marginTop: 14,
                borderRadius: 16,
                padding: 14,
                backgroundColor: "rgba(17,17,17,0.04)",
              }}
            >
              <Text
                style={{ fontSize: 12, color: "#6B7280", fontWeight: "800" }}
              >
                Your balance
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 20,
                  fontWeight: "900",
                  color: "#111",
                }}
              >
                {formatMoney(balanceCents)}
              </Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
                Needed: {formatMoney(requiredCents)}
              </Text>
            </View>

            {statusQuery.isFetching ? (
              <View style={{ marginTop: 12 }}>
                <ActivityIndicator color="#111" />
              </View>
            ) : null}

            {uiError ? (
              <Text
                style={{
                  marginTop: 12,
                  color: "#B91C1C",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {uiError}
              </Text>
            ) : null}

            {!hasCredit ? (
              <TouchableOpacity
                onPress={onPressPurchase}
                activeOpacity={0.9}
                style={{
                  marginTop: 16,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 14, alignItems: "center" }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}
                  >
                    Buy date credit
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={exitSafe}
                activeOpacity={0.9}
                style={{
                  marginTop: 16,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: "rgba(17,17,17,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.08)",
                }}
              >
                <Text style={{ color: "#111", fontWeight: "900" }}>Got it</Text>
              </TouchableOpacity>
            )}

            {!required ? (
              <TouchableOpacity
                onPress={closeSafe}
                activeOpacity={0.9}
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#111", fontWeight: "900" }}>
                  Not now
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={exitSafe}
                activeOpacity={0.9}
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#111", fontWeight: "900" }}>
                  Go back
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}
