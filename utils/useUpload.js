import * as React from "react";
import { Platform } from "react-native";

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(null); // 0..1 while uploading
  const [bytesSent, setBytesSent] = React.useState(null);
  const [bytesTotal, setBytesTotal] = React.useState(null);

  const safeStringify = React.useCallback((value) => {
    try {
      if (typeof value === "string") return value;
      if (value instanceof Error) {
        return value.message || "Error";
      }
      return JSON.stringify(value);
    } catch {
      try {
        return String(value);
      } catch {
        return "[unprintable error]";
      }
    }
  }, []);

  const resolveEndpoint = React.useCallback((path) => {
    // In the Anything mobile runtime, `fetch('/api/...')` works, but XHR can require
    // an absolute URL. Use the platform-provided base URLs when available.
    if (typeof path !== "string") return path;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (Platform.OS === "web") return path;

    const base =
      process.env.EXPO_PUBLIC_PROXY_BASE_URL ||
      process.env.EXPO_PUBLIC_BASE_URL ||
      "";

    if (!base) return path;

    const trimmedBase = String(base).replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${trimmedBase}${normalizedPath}`;
  }, []);

  const uriToBlob = React.useCallback(async (uri) => {
    // iOS/Expo can be picky with fetch(file://...) for blobs.
    // XMLHttpRequest blob loading is the most compatible approach.
    return await new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.onerror = () => reject(new Error("Could not read local file"));
        xhr.onload = () => {
          resolve(xhr.response);
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      } catch (e) {
        reject(e);
      }
    });
  }, []);

  const resetProgress = React.useCallback(() => {
    setProgress(null);
    setBytesSent(null);
    setBytesTotal(null);
  }, []);

  const xhrPostFormData = React.useCallback(async (url, formData, opts) => {
    const onProgress = opts?.onProgress;
    const timeoutMs = typeof opts?.timeoutMs === "number" ? opts.timeoutMs : 0; // 0 = no timeout
    const withCredentials =
      typeof opts?.withCredentials === "boolean" ? opts.withCredentials : true;

    return await new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        // For same-origin (Anything) uploads we want cookies; for 3rd party (Uploadcare) we don't.
        xhr.withCredentials = withCredentials;

        // IMPORTANT: make uploads feel "alive".
        xhr.upload.onprogress = (e) => {
          try {
            if (e && e.lengthComputable) {
              const nextProgress = e.total > 0 ? e.loaded / e.total : null;
              setProgress(nextProgress);
              setBytesSent(e.loaded);
              setBytesTotal(e.total);
              if (typeof onProgress === "function") {
                onProgress({
                  loaded: e.loaded,
                  total: e.total,
                  progress: nextProgress,
                });
              }
            }
          } catch {
            // ignore
          }
        };

        xhr.onerror = () => {
          reject(new Error(`Upload failed: network error (${String(url)})`));
        };

        xhr.ontimeout = () => {
          reject(new Error("Upload failed: timed out"));
        };

        xhr.onload = () => {
          const ok = xhr.status >= 200 && xhr.status < 300;
          if (!ok) {
            // Attempt to include any response body
            let extra = "";
            try {
              const t = xhr.responseText;
              if (t) extra = ` - ${String(t).slice(0, 200)}`;
            } catch {
              // ignore
            }
            reject(
              new Error(
                `Upload failed: [${xhr.status}] ${xhr.statusText}${extra}`,
              ),
            );
            return;
          }

          try {
            const text = xhr.responseText;
            const json = text ? JSON.parse(text) : null;
            resolve(json);
          } catch (e) {
            // Add a useful snippet to debug 3rd-party / proxy weirdness in TestFlight.
            let snippet = "";
            try {
              const t = xhr.responseText;
              const cleaned = t ? String(t).replace(/\s+/g, " ").trim() : "";
              if (cleaned) {
                snippet = ` - ${cleaned.slice(0, 220)}`;
              }
            } catch {
              // ignore
            }

            const label = String(url || "").includes("upload.uploadcare.com")
              ? "Uploadcare"
              : "server";

            reject(
              new Error(
                `Upload failed: ${label} returned an invalid JSON response${snippet}`,
              ),
            );
          }
        };

        xhr.open("POST", url, true);
        xhr.timeout = timeoutMs;
        xhr.setRequestHeader("Accept", "application/json");
        // IMPORTANT: do NOT set Content-Type; XHR will set boundary.
        xhr.send(formData);
      } catch (e) {
        reject(e);
      }
    });
  }, []);

  // NEW: Uploadcare direct upload fallback for very large files (avoids 413 from Anything upload route)
  const uploadToUploadcare = React.useCallback(
    async (asset) => {
      const publicKey = process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error(
          "Upload failed: Uploadcare public key is not set (EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY)",
        );
      }

      const nameFromUri = asset.uri.split("/").pop() || "upload";
      const name = asset?.name || asset?.fileName || nameFromUri;

      const typeFromMime = asset?.mimeType;
      const typeFromAssetType =
        asset?.type === "image"
          ? "image/jpeg"
          : asset?.type === "video"
            ? "video/mp4"
            : null;
      const type =
        typeFromMime || typeFromAssetType || "application/octet-stream";

      const formData = new FormData();
      formData.append("UPLOADCARE_PUB_KEY", publicKey);
      formData.append("UPLOADCARE_STORE", "1");

      // React Native supports streaming files in FormData via { uri, name, type }
      formData.append("file", { uri: asset.uri, name, type });

      // Use Uploadcare base upload endpoint
      const json = await xhrPostFormData(
        "https://upload.uploadcare.com/base/",
        formData,
        { timeoutMs: 0, withCredentials: false },
      );

      // Uploadcare success responses typically include { file: "<uuid>" }
      // Error responses sometimes come back as 200s in some proxy/runtime combos.
      // Make the error message actionable.
      const uuid = json?.file || json?.uuid;
      if (!uuid || typeof uuid !== "string") {
        let details = "";
        try {
          const msg = json?.error || json?.message || json?.detail;
          if (msg) {
            details = ` - ${safeStringify(msg).slice(0, 180)}`;
          } else if (json && typeof json === "object") {
            details = ` - ${safeStringify(json).slice(0, 220)}`;
          }
        } catch {
          // ignore
        }

        throw new Error(
          `Upload failed: Uploadcare returned an invalid response${details}`,
        );
      }

      return {
        url: `https://ucarecdn.com/${uuid}/`,
        mimeType: type,
      };
    },
    [safeStringify, xhrPostFormData],
  );

  // NEW: prevent infinite spinners on slow / stuck uploads for non-file uploads
  const fetchWithTimeout = React.useCallback(
    async (url, options, timeoutMs) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(t);
      }
    },
    [],
  );

  const upload = React.useCallback(
    async (input) => {
      try {
        setLoading(true);
        resetProgress();

        // IMPORTANT: match the Anything upload route exactly.
        // (Avoiding redirects is critical for multipart uploads in some RN runtimes.)
        const uploadEndpoint = resolveEndpoint("/_create/api/upload/");

        let response;

        if ("reactNativeAsset" in input && input.reactNativeAsset) {
          const asset = input.reactNativeAsset;

          if (!asset?.uri || typeof asset.uri !== "string") {
            throw new Error("Upload failed: missing file uri");
          }

          // iOS sometimes returns a Photos library reference (ph://...) which can't be posted as multipart.
          if (asset.uri.startsWith("ph://")) {
            throw new Error(
              "Upload failed: iPhone returned a Photos reference (ph://). Please select from Files (or export it to Files) and try again.",
            );
          }

          const nameFromUri = asset.uri.split("/").pop() || "upload";
          const name = asset?.name || asset?.fileName || nameFromUri;

          const typeFromMime = asset?.mimeType;
          const typeFromAssetType =
            asset?.type === "image"
              ? "image/jpeg"
              : asset?.type === "video"
                ? "video/mp4"
                : null;
          const type =
            typeFromMime || typeFromAssetType || "application/octet-stream";

          const isVideo =
            asset?.type === "video" ||
            (typeof type === "string" && type.startsWith("video/"));
          const isImage =
            asset?.type === "image" ||
            (typeof type === "string" && type.startsWith("image/"));

          const formData = new FormData();

          // Prefer streaming file upload via uri.
          // This avoids converting massive videos into JS memory (Blob/base64) which can look like a hang.
          let appended = false;
          try {
            formData.append("file", { uri: asset.uri, name, type });
            appended = true;
          } catch {
            // Fallback: blob (mainly for older iOS/expo edge cases)
          }

          if (!appended) {
            if (isVideo) {
              // IMPORTANT: do not try to read huge videos into JS memory.
              throw new Error(
                "Upload failed: this device/runtime couldn't attach the video file for upload. Try choosing the video from Files instead of Photos (it forces a real file path), or re-record at a smaller size.",
              );
            }

            const blob = await uriToBlob(asset.uri);
            const finalBlob = blob?.type ? blob : new Blob([blob], { type });
            formData.append("file", finalBlob, name);
          }

          // 1) Try the Anything upload route first (keeps everything consistent)
          // 2) If we hit a 413, fall back to Uploadcare direct upload (supports large files)
          try {
            const json = await xhrPostFormData(uploadEndpoint, formData, {
              timeoutMs: 0,
            });

            if (!json || typeof json !== "object") {
              throw new Error("Upload failed: invalid response");
            }

            return { url: json.url, mimeType: json.mimeType || type };
          } catch (e) {
            const msg = String(e?.message || "");
            const is413 = msg.includes("[413]") || msg.includes("413");
            const is400 = msg.includes("[400]") || msg.includes("400");
            const looksLikeInvalidRequest = msg
              .toLowerCase()
              .includes("invalid request");

            // For big files, fall back to Uploadcare
            if (is413) {
              const out = await uploadToUploadcare({
                ...asset,
                mimeType: type,
              });
              return out;
            }

            // We’ve seen Anything’s upload route occasionally return a vague 400 on iOS
            // for certain camera assets. For images, fall back to Uploadcare.
            if (isImage && (is400 || looksLikeInvalidRequest)) {
              const out = await uploadToUploadcare({
                ...asset,
                mimeType: type,
              });
              return out;
            }

            throw e;
          }
        }

        if ("url" in input) {
          response = await fetchWithTimeout(
            uploadEndpoint,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ url: input.url }),
            },
            30_000,
          );
        } else if ("base64" in input) {
          response = await fetchWithTimeout(
            uploadEndpoint,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ base64: input.base64 }),
            },
            90_000,
          );
        } else {
          response = await fetchWithTimeout(
            uploadEndpoint,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/octet-stream",
              },
              body: input.buffer,
            },
            90_000,
          );
        }

        if (!response.ok) {
          if (response.status === 413) {
            throw new Error(
              "Upload failed: File too large. Try recording at 1080p/720p or exporting a smaller copy.",
            );
          }

          let extra = "";
          try {
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const j = await response.json();
              const msg = j?.error || j?.message;
              if (msg) extra = ` - ${msg}`;
            } else {
              const t = await response.text();
              if (t) extra = ` - ${t.slice(0, 200)}`;
            }
          } catch {
            // ignore
          }

          throw new Error(
            `Upload failed: [${response.status}] ${response.statusText}${extra}`,
          );
        }

        const data = await response.json();
        return { url: data.url, mimeType: data.mimeType || null };
      } catch (uploadError) {
        // AbortController timeouts land here as a DOMException / Error depending on runtime
        const msg =
          uploadError &&
          typeof uploadError === "object" &&
          "name" in uploadError
            ? String(uploadError.name)
            : "";
        const isAbort =
          msg === "AbortError" ||
          String(uploadError?.message || "").includes("aborted");

        if (isAbort) {
          return {
            error:
              "Upload timed out. Try again on faster wifi or export a smaller copy.",
          };
        }

        if (uploadError instanceof Error) {
          return { error: uploadError.message };
        }
        if (typeof uploadError === "string") {
          return { error: uploadError };
        }
        if (uploadError && typeof uploadError === "object") {
          return { error: safeStringify(uploadError) };
        }
        return { error: "Upload failed" };
      } finally {
        setLoading(false);
        // Keep progress for the UI for a beat; consumers can clear if they want.
        // resetProgress();
      }
    },
    [
      fetchWithTimeout,
      resetProgress,
      resolveEndpoint,
      safeStringify,
      uploadToUploadcare,
      uriToBlob,
      xhrPostFormData,
    ],
  );

  return [upload, { loading, progress, bytesSent, bytesTotal }];
}

export { useUpload };
export default useUpload;
