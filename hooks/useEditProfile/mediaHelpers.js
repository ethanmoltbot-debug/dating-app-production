import { useCallback } from "react";

export function useMediaHelpers() {
  const normalizeVideoUrl = useCallback((v) => {
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && typeof v.url === "string") return v.url;
    return null;
  }, []);

  return {
    normalizeVideoUrl,
  };
}
