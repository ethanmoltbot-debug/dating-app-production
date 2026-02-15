import { useEffect, useRef, useCallback } from "react";
import { useIsFocused } from "@react-navigation/native";

export function usePresencePing(userId, options) {
  const isFocused = useIsFocused();
  const intervalMs = Number(options?.intervalMs) || 30_000;
  const enabled = options?.enabled !== false;

  const busyRef = useRef(false);

  const pingOnce = useCallback(async () => {
    if (!enabled) return;
    const uid = Number(userId);
    if (!Number.isFinite(uid)) return;
    if (busyRef.current) return;

    busyRef.current = true;
    try {
      const resp = await fetch("/api/presence/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, platform: "mobile" }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `When posting /api/presence/ping, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
    } catch (e) {
      // Presence is best-effort — never block UI.
      console.error("[presence] ping failed", e);
    } finally {
      busyRef.current = false;
    }
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled) return;
    if (!isFocused) return;

    let alive = true;

    const start = async () => {
      if (!alive) return;
      await pingOnce();
    };

    start();
    const interval = setInterval(() => {
      pingOnce();
    }, intervalMs);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [enabled, intervalMs, isFocused, pingOnce]);
}
