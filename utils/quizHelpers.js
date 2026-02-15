export function buildApiUrl(path) {
  const raw = String(path || "");
  if (!raw) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;

  const proxyBase = String(process.env.EXPO_PUBLIC_PROXY_BASE_URL || "").trim();
  const base = String(process.env.EXPO_PUBLIC_BASE_URL || "").trim();

  const root = proxyBase || base;
  if (!root) {
    return withSlash;
  }

  const cleanedRoot = root.endsWith("/") ? root.slice(0, -1) : root;
  return `${cleanedRoot}${withSlash}`;
}

export const QUIZ_CONSTANTS = {
  BG_GRADIENT: ["#F7EEFF", "#F2F7FF", "#FFF1F7"],
  CTA_GRADIENT: ["#FF4FD8", "#7C3AED"],
  ACCENT: "#7C3AED",
};
