import { useMemo } from "react";

export function useProfileSections(
  photos,
  prompts,
  videos,
  interests,
  voicePrompt,
  showDatingInsights,
  bio,
) {
  return useMemo(() => {
    const out = [];

    const heroPhoto = photos[0] || null;
    out.push({ type: "heroPhoto", uri: heroPhoto });

    if (showDatingInsights) {
      out.push({ type: "insights" });
    }

    const hasBio = typeof bio === "string" && bio.trim().length > 0;
    if (hasBio) {
      out.push({ type: "about" });
    }

    out.push({ type: "basics" });

    const restPhotos = photos.slice(1);
    const max = Math.max(restPhotos.length, prompts.length);

    for (let i = 0; i < max; i += 1) {
      const p = prompts[i];
      if (p) {
        out.push({ type: "prompt", prompt: p, idx: i });
      }

      const photoUri = restPhotos[i];
      if (photoUri) {
        out.push({ type: "photo", uri: photoUri, idx: i });
      }
    }

    for (let i = 0; i < videos.length; i += 1) {
      out.push({ type: "video", uri: videos[i], idx: i });
    }

    if (Array.isArray(interests) && interests.length > 0) {
      out.push({ type: "interests" });
    }

    if (voicePrompt?.audioUrl) {
      out.push({ type: "voice" });
    }

    return out;
  }, [
    interests,
    photos,
    prompts,
    showDatingInsights,
    videos,
    voicePrompt?.audioUrl,
    bio,
  ]);
}
