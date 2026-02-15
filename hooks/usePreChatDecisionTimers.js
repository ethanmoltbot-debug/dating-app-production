import { useEffect, useRef } from "react";

export function usePreChatDecisionTimers({
  user,
  preChatRows,
  loading,
  otherChatsHidden,
  loadMatches,
}) {
  const startedDecisionTimersRef = useRef(new Set());

  useEffect(() => {
    if (otherChatsHidden) return;

    const userIdNum = Number(user?.id);
    if (!Number.isFinite(userIdNum)) return;
    if (loading) return;

    const candidates = (Array.isArray(preChatRows) ? preChatRows : [])
      .filter((m) => String(m?.prechat_role) === "receiver")
      .filter((m) => !m?.decision_expires_at)
      .filter((m) => !m?.terminal_state)
      .slice(0, 6);

    const toStart = candidates.filter((m) => {
      const idStr = m?.match_id != null ? String(m.match_id) : "";
      if (!idStr) return false;
      if (startedDecisionTimersRef.current.has(idStr)) return false;
      return true;
    });

    if (toStart.length === 0) return;

    toStart.forEach((m) => {
      const idStr = String(m.match_id);
      startedDecisionTimersRef.current.add(idStr);
    });

    let cancelled = false;

    const run = async () => {
      try {
        const results = await Promise.all(
          toStart.map(async (m) => {
            const matchIdStr = String(m.match_id);
            const resp = await fetch(
              `/api/conversations/prechat-seen/${encodeURIComponent(matchIdStr)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userIdNum }),
              },
            );

            if (!resp.ok) {
              const text = await resp.text().catch(() => "");
              throw new Error(
                `When posting /api/conversations/prechat-seen/${matchIdStr}, the response was [${resp.status}] ${resp.statusText}. ${text}`,
              );
            }

            const data = await resp.json().catch(() => ({}));
            return Boolean(data?.started);
          }),
        );

        const startedAny = results.some(Boolean);
        if (!cancelled && startedAny) {
          await loadMatches(userIdNum);
        }
      } catch (e) {
        console.error(e);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [loading, loadMatches, otherChatsHidden, preChatRows, user?.id]);
}
