import { useMemo } from "react";

export function useProfileData(profile, preferences) {
  const photos = useMemo(() => {
    const list = Array.isArray(profile?.photos) ? profile.photos : [];
    return list.filter((p) => typeof p === "string" && p.length > 0);
  }, [profile?.photos]);

  const videos = useMemo(() => {
    const list = Array.isArray(preferences?.videos) ? preferences.videos : [];

    const normalized = list
      .map((v) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object" && typeof v.url === "string")
          return v.url;
        return null;
      })
      .filter((v) => typeof v === "string" && v.length > 0);

    return normalized;
  }, [preferences?.videos]);

  const interests = useMemo(() => {
    const list = Array.isArray(preferences?.interests)
      ? preferences.interests
      : [];
    return list.filter((x) => typeof x === "string" && x.trim().length > 0);
  }, [preferences?.interests]);

  const prompts = useMemo(() => {
    const list = Array.isArray(preferences?.prompts) ? preferences.prompts : [];
    return (
      list
        .map((p) => ({
          question: typeof p?.question === "string" ? p.question : "",
          answer: typeof p?.answer === "string" ? p.answer : "",
        }))
        // Only include prompts that were actually answered
        .filter(
          (p) => typeof p.answer === "string" && p.answer.trim().length > 0,
        )
        .slice(0, 3)
    );
  }, [preferences?.prompts]);

  const voicePrompt = useMemo(() => {
    const vp = preferences?.voicePrompt || {};
    return {
      question: typeof vp?.question === "string" ? vp.question : "",
      audioUrl: typeof vp?.audioUrl === "string" ? vp.audioUrl : "",
    };
  }, [preferences?.voicePrompt]);

  return {
    photos,
    videos,
    interests,
    prompts,
    voicePrompt,
  };
}
