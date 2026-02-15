// Utilities for preparing a shareable *image item* for the native share sheet.
//
// IMPORTANT:
// - expo-image-manipulator only works with images stored on the local file system.
// - In this project we avoid adding new native packages.
//
// So we fetch the remote image and convert it into a data URL (base64).
// iOS treats a data:image/* URL as an image item more reliably than an http(s) URL.

function base64FromArrayBuffer(arrayBuffer) {
  // Convert ArrayBuffer -> base64 without Buffer (works in RN/JS).
  const bytes = new Uint8Array(arrayBuffer);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  let base64 = "";
  let i = 0;

  for (; i + 2 < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    base64 += alphabet[(chunk >> 18) & 63];
    base64 += alphabet[(chunk >> 12) & 63];
    base64 += alphabet[(chunk >> 6) & 63];
    base64 += alphabet[chunk & 63];
  }

  const remaining = bytes.length - i;
  if (remaining === 1) {
    const chunk = bytes[i] << 16;
    base64 += alphabet[(chunk >> 18) & 63];
    base64 += alphabet[(chunk >> 12) & 63];
    base64 += "==";
  } else if (remaining === 2) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8);
    base64 += alphabet[(chunk >> 18) & 63];
    base64 += alphabet[(chunk >> 12) & 63];
    base64 += alphabet[(chunk >> 6) & 63];
    base64 += "=";
  }

  return base64;
}

export async function prepareShareCardDataUrl(remoteUrl) {
  if (!remoteUrl || typeof remoteUrl !== "string") {
    throw new Error("Missing remoteUrl");
  }

  const resp = await fetch(remoteUrl);
  if (!resp.ok) {
    throw new Error(
      `When fetching share image, the response was [${resp.status}] ${resp.statusText}`,
    );
  }

  const contentType = resp.headers.get("content-type") || "image/png";
  const buf = await resp.arrayBuffer();
  const base64 = base64FromArrayBuffer(buf);

  return {
    dataUrl: `data:${contentType};base64,${base64}`,
    contentType,
  };
}
