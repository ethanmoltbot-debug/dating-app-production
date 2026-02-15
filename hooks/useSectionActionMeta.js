import { useCallback } from "react";

export function useSectionActionMeta(
  titleName,
  profile,
  locationText,
  basicsItems,
  interests,
  voicePrompt,
) {
  return useCallback(
    (section) => {
      const type = section?.type;

      if (type === "heroPhoto") {
        return {
          type: "photo",
          key: "photo:hero",
          label: "Photo",
          payload: {
            uri: typeof section?.uri === "string" ? section.uri : "",
          },
        };
      }

      if (type === "photo") {
        const idx = typeof section?.idx === "number" ? section.idx : 0;
        return {
          type: "photo",
          key: `photo:${idx + 1}`,
          label: "Photo",
          payload: {
            uri: typeof section?.uri === "string" ? section.uri : "",
          },
        };
      }

      if (type === "video") {
        const idx = typeof section?.idx === "number" ? section.idx : 0;
        return {
          type: "video",
          key: `video:${idx}`,
          label: "Video",
          payload: {
            uri: typeof section?.uri === "string" ? section.uri : "",
          },
        };
      }

      if (type === "prompt") {
        const idx = typeof section?.idx === "number" ? section.idx : 0;
        const q = section?.prompt?.question || "Prompt";
        const a = section?.prompt?.answer || "";
        return {
          type: "prompt",
          key: `prompt:${idx}`,
          label: q,
          payload: {
            question: q,
            answer: a,
          },
        };
      }

      if (type === "about") {
        return {
          type: "about",
          key: "about",
          label: "About Me",
          payload: {
            name: titleName,
            bio: profile?.bio || "",
            location: locationText,
          },
        };
      }

      if (type === "basics") {
        const rowText = basicsItems
          .map((r) => (typeof r?.text === "string" ? r.text : ""))
          .filter((x) => x);

        return {
          type: "basics",
          key: "basics",
          label: "Basics",
          payload: {
            rows: rowText,
          },
        };
      }

      if (type === "interests") {
        return {
          type: "interests",
          key: "interests",
          label: "Interests",
          payload: {
            tags: interests,
          },
        };
      }

      if (type === "voice") {
        return {
          type: "voice",
          key: "voice",
          label: "Voice prompt",
          payload: {
            question: voicePrompt.question,
            hasVoice: !!voicePrompt.audioUrl,
          },
        };
      }

      return { type: "unknown", key: "unknown", label: "Profile" };
    },
    [
      basicsItems,
      interests,
      locationText,
      profile?.bio,
      titleName,
      voicePrompt.audioUrl,
      voicePrompt.question,
    ],
  );
}
