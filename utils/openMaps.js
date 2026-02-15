import { Linking, Platform } from "react-native";

async function tryOpen(url) {
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function openMaps({ query, lat, lng }) {
  const q = String(query || "").trim();
  const hasCoords =
    Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  // Prefer native apps first.
  if (Platform.OS === "ios") {
    if (hasCoords) {
      const url = `maps://?daddr=${Number(lat)},${Number(lng)}`;
      const ok = await tryOpen(url);
      if (ok) return true;

      const fallback = `https://maps.apple.com/?daddr=${Number(lat)},${Number(lng)}`;
      const ok2 = await tryOpen(fallback);
      if (ok2) return true;
    }

    if (q) {
      const url = `maps://?q=${encodeURIComponent(q)}`;
      const ok = await tryOpen(url);
      if (ok) return true;

      const fallback = `https://maps.apple.com/?q=${encodeURIComponent(q)}`;
      const ok2 = await tryOpen(fallback);
      if (ok2) return true;
    }
  }

  if (Platform.OS === "android") {
    if (hasCoords) {
      const label = q ? `(${q})` : "";
      const url = `geo:0,0?q=${Number(lat)},${Number(lng)}${label}`;
      const ok = await tryOpen(url);
      if (ok) return true;
    }

    if (q) {
      const url = `geo:0,0?q=${encodeURIComponent(q)}`;
      const ok = await tryOpen(url);
      if (ok) return true;
    }
  }

  // Last resort: web
  if (hasCoords) {
    return tryOpen(
      `https://www.google.com/maps/search/?api=1&query=${Number(lat)},${Number(lng)}`,
    );
  }
  if (q) {
    return tryOpen(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    );
  }

  return false;
}
