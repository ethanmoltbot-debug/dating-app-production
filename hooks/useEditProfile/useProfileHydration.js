import { useEffect, useCallback } from "react";

export function useProfileHydration({
  data,
  serverProfile,
  preferences,
  setDisplayName,
  setBio,
  setPhotos,
  setAge,
  setGender,
  setLocation,
  setPhoneNumber,
  setCategory,
  setBasicHeight,
  setBasicJobTitle,
  setBasicCompany,
  setBasicEducation,
  setBasicLookingFor,
  setBasicSexuality,
  setVideos,
  setInterests,
  setPrompts,
  setVoicePrompt,
  normalizeVideoUrl,
}) {
  useEffect(() => {
    if (!serverProfile && data?.user) {
      // No server profile yet; set some nice defaults.
      const email = data.user?.email;
      const name = typeof email === "string" ? email.split("@")[0] : "";
      setDisplayName(name || "");
      return;
    }

    if (serverProfile) {
      setDisplayName(serverProfile.display_name || "");
      setBio(serverProfile.bio || "");
      setPhotos(
        Array.isArray(serverProfile.photos) ? serverProfile.photos : [],
      );

      setAge(serverProfile.age ? String(serverProfile.age) : "");
      setGender(serverProfile.gender || "");
      setLocation(serverProfile.location || "");
      setPhoneNumber(serverProfile.phone_number || "");

      // Category is stored in preferences
      setCategory(String(preferences?.category || ""));

      const rawBasics =
        preferences?.basics && typeof preferences.basics === "object"
          ? preferences.basics
          : {};

      setBasicHeight(String(rawBasics.height || preferences.height || ""));

      // Work fields (support old `work` plus new `jobTitle` + `company`)
      const fallbackWork = String(rawBasics.work || preferences.work || "");
      const jobTitleRaw = String(rawBasics.jobTitle || "");
      const companyRaw = String(rawBasics.company || "");

      if (!jobTitleRaw && !companyRaw && fallbackWork.includes(" at ")) {
        const parts = fallbackWork.split(" at ");
        const jt = String(parts[0] || "").trim();
        const co = String(parts.slice(1).join(" at ") || "").trim();
        setBasicJobTitle(jt);
        setBasicCompany(co);
      } else {
        setBasicJobTitle(jobTitleRaw);
        setBasicCompany(companyRaw);
      }

      setBasicEducation(
        String(rawBasics.education || preferences.education || ""),
      );
      setBasicLookingFor(
        String(rawBasics.lookingFor || preferences.lookingFor || ""),
      );
      setBasicSexuality(
        String(rawBasics.sexuality || rawBasics.orientation || ""),
      );

      const prefVideosRaw = Array.isArray(preferences.videos)
        ? preferences.videos
        : [];

      const prefVideos = prefVideosRaw
        .map(normalizeVideoUrl)
        .filter((x) => typeof x === "string" && x.length > 0);

      // Only 1 video supported in the product.
      setVideos(prefVideos.slice(0, 1));

      const prefInterests = Array.isArray(preferences.interests)
        ? preferences.interests
        : [];
      setInterests(prefInterests);

      const prefPrompts = Array.isArray(preferences.prompts)
        ? preferences.prompts
        : [];
      const normalized = [0, 1, 2].map((i) => {
        const p = prefPrompts[i];
        return {
          question: p?.question || "",
          answer: p?.answer || "",
        };
      });
      setPrompts(normalized);

      const vp = preferences.voicePrompt || {};
      setVoicePrompt({
        question: vp?.question || "",
        audioUrl: vp?.audioUrl || "",
        fileName: vp?.fileName || "",
        waveform: Array.isArray(vp?.waveform) ? vp.waveform : [],
      });
    }
  }, [
    data?.user,
    preferences,
    serverProfile,
    preferences.interests,
    preferences.prompts,
    preferences.voicePrompt,
    preferences.videos,
    normalizeVideoUrl,
    setDisplayName,
    setBio,
    setPhotos,
    setAge,
    setGender,
    setLocation,
    setPhoneNumber,
    setCategory,
    setBasicHeight,
    setBasicJobTitle,
    setBasicCompany,
    setBasicEducation,
    setBasicLookingFor,
    setBasicSexuality,
    setVideos,
    setInterests,
    setPrompts,
    setVoicePrompt,
  ]);
}
