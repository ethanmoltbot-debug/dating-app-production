import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

export function useProfileSave({
  data,
  preferences,
  displayName,
  age,
  gender,
  bio,
  photos,
  location,
  phoneNumber,
  category,
  basicHeight,
  basicJobTitle,
  basicCompany,
  basicEducation,
  basicLookingFor,
  basicSexuality,
  interests,
  prompts,
  voicePrompt,
  videos,
  normalizeVideoUrl,
}) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = data?.user?.id;
      if (!userId) {
        throw new Error("Missing user id");
      }

      const ageTrimmed = String(age || "").trim();
      const ageNum = ageTrimmed ? Number(ageTrimmed) : null;
      if (ageNum !== null) {
        const invalid = !Number.isFinite(ageNum) || ageNum < 18 || ageNum > 99;
        if (invalid) {
          throw new Error("Please enter a valid age (18–99). ");
        }
      }

      const locationTrimmed = String(location || "").trim();
      const genderTrimmed = String(gender || "").trim();
      const phoneTrimmed = String(phoneNumber || "").trim();

      const prevBasics =
        preferences?.basics && typeof preferences.basics === "object"
          ? preferences.basics
          : {};

      const jobTitleTrimmed = String(basicJobTitle || "").trim();
      const companyTrimmed = String(basicCompany || "").trim();
      const workCombined =
        jobTitleTrimmed && companyTrimmed
          ? `${jobTitleTrimmed} at ${companyTrimmed}`
          : jobTitleTrimmed
            ? jobTitleTrimmed
            : companyTrimmed
              ? `Works at ${companyTrimmed}`
              : "";

      const nextBasics = {
        ...prevBasics,
        height: String(basicHeight || "").trim(),
        jobTitle: jobTitleTrimmed,
        company: companyTrimmed,
        // keep `work` for backward-compat across older UI
        work: workCombined,
        education: String(basicEducation || "").trim(),
        lookingFor: String(basicLookingFor || "").trim(),
        sexuality: String(basicSexuality || "").trim(),
      };

      const nextPreferences = {
        ...preferences,
        category: String(category || "").trim(),
        basics: nextBasics,
        interests,
        prompts,
        voicePrompt,
        // IMPORTANT: store videos as string URLs for compatibility across the app
        videos: (Array.isArray(videos) ? videos : [])
          .map(normalizeVideoUrl)
          .filter((x) => typeof x === "string" && x.length > 0)
          .slice(0, 1),
      };

      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          displayName,
          age: ageNum,
          gender: genderTrimmed ? genderTrimmed : null,
          bio,
          photos,
          location: locationTrimmed ? locationTrimmed : null,
          phoneNumber: phoneTrimmed ? phoneTrimmed : null,
          preferences: nextPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `When updating /api/profile/me, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: (e) => {
      console.error(e);
      Alert.alert(
        "Could not save",
        e?.message || "Something went wrong saving your profile.",
      );
    },
  });

  return saveMutation;
}
