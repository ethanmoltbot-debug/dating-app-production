import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DATING_PREFS_STORAGE_KEY,
  normalizePrefsFromStorage,
} from "@/utils/datingPreferences";
import {
  safeJsonObject,
  getNested,
  formatHeight,
} from "@/utils/onboardingProfileHelpers";

export function useOnboardingProfile() {
  const [heightInches, setHeightInches] = useState(null);
  const [ageMin, setAgeMin] = useState(22);
  const [ageMax, setAgeMax] = useState(35);
  const [bornIn, setBornIn] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [primaryPhotoUrl, setPrimaryPhotoUrl] = useState("");
  const [extraPhotoUrls, setExtraPhotoUrls] = useState([]);
  const [ethnicity, setEthnicity] = useState("");
  const [religion, setReligion] = useState("");
  const [politics, setPolitics] = useState("");
  const [workout, setWorkout] = useState("sometimes");
  const [smoke, setSmoke] = useState("no");
  const [drink, setDrink] = useState("sometimes");
  const [diet, setDiet] = useState("no_preference");
  const [about, setAbout] = useState("");
  const [interests, setInterests] = useState([]);

  const localUserQuery = useQuery({
    queryKey: ["me", "localUser"],
    queryFn: async () => {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
  });

  const userId = localUserQuery.data?.id
    ? Number(localUserQuery.data.id)
    : null;

  const profileQuery = useQuery({
    queryKey: ["profile", "me", userId],
    enabled: Number.isFinite(userId),
    queryFn: async () => {
      const resp = await fetch(`/api/profile/me?userId=${userId}`);
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/profile/me, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      const json = await resp.json();
      return json?.profile || null;
    },
    staleTime: 30_000,
  });

  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    if (!profileQuery.data) return;

    const profile = profileQuery.data;
    const prefs = safeJsonObject(profile?.preferences);
    const basics =
      prefs?.basics && typeof prefs.basics === "object" ? prefs.basics : {};

    const existingHeight = getNested(basics, "height", "");
    if (typeof existingHeight === "string" && existingHeight.includes("'")) {
      const m = existingHeight.match(/(\d+)'(\d+)/);
      if (m) {
        const ft = Number(m[1]);
        const inch = Number(m[2]);
        const total = ft * 12 + inch;
        if (Number.isFinite(total)) {
          setHeightInches(total);
        }
      }
    }

    const existingBornIn = getNested(basics, "bornIn", "");
    if (typeof existingBornIn === "string" && existingBornIn) {
      setBornIn(existingBornIn);
    }

    const existingJobTitle = getNested(basics, "jobTitle", "");
    if (typeof existingJobTitle === "string" && existingJobTitle) {
      setJobTitle(existingJobTitle);
    }

    const existingCompany = getNested(basics, "company", "");
    if (typeof existingCompany === "string" && existingCompany) {
      setCompany(existingCompany);
    }

    const existingEthnicity = getNested(prefs, "demographics.ethnicity", "");
    if (typeof existingEthnicity === "string" && existingEthnicity) {
      setEthnicity(existingEthnicity);
    }

    const existingReligion = getNested(prefs, "demographics.religion", "");
    if (typeof existingReligion === "string" && existingReligion) {
      setReligion(existingReligion);
    }

    const existingPolitics = getNested(prefs, "demographics.politics", "");
    if (typeof existingPolitics === "string" && existingPolitics) {
      setPolitics(existingPolitics);
    }

    const existingLifestyle =
      prefs?.lifestyle && typeof prefs.lifestyle === "object"
        ? prefs.lifestyle
        : {};
    if (typeof existingLifestyle.workout === "string") {
      setWorkout(existingLifestyle.workout);
    }
    if (typeof existingLifestyle.smoke === "string") {
      setSmoke(existingLifestyle.smoke);
    }
    if (typeof existingLifestyle.drink === "string") {
      setDrink(existingLifestyle.drink);
    }
    if (typeof existingLifestyle.diet === "string") {
      setDiet(existingLifestyle.diet);
    }

    if (typeof profile?.bio === "string" && profile.bio) {
      setAbout(profile.bio);
    }

    const existingInterests = Array.isArray(prefs?.interests)
      ? prefs.interests
      : [];
    const cleaned = existingInterests
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
    if (cleaned.length) {
      setInterests(cleaned);
    }

    const existingPhotos = Array.isArray(profile?.photos) ? profile.photos : [];
    if (existingPhotos?.[0] && typeof existingPhotos[0] === "string") {
      setPrimaryPhotoUrl(existingPhotos[0]);
    }

    if (existingPhotos?.length > 1) {
      const rest = existingPhotos
        .slice(1)
        .filter((x) => typeof x === "string" && x.length > 0);
      if (rest.length) {
        setExtraPhotoUrls(rest);
      }
    }

    seededRef.current = true;
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (vars) => {
      const skippedSteps =
        vars && typeof vars === "object" && vars.skippedSteps
          ? vars.skippedSteps
          : {};

      if (!Number.isFinite(userId)) {
        throw new Error("Please sign in again.");
      }

      const profile = profileQuery.data;
      const serverPrefs = safeJsonObject(profile?.preferences);
      const serverBasics =
        serverPrefs?.basics && typeof serverPrefs.basics === "object"
          ? serverPrefs.basics
          : {};

      const nextBasics = {
        ...serverBasics,
        height: heightInches ? formatHeight(heightInches) : serverBasics.height,
        bornIn: bornIn ? bornIn.trim().slice(0, 120) : serverBasics.bornIn,
        jobTitle: jobTitle
          ? jobTitle.trim().slice(0, 80)
          : serverBasics.jobTitle,
        company: company ? company.trim().slice(0, 80) : serverBasics.company,
      };

      const demographicsFromServer =
        serverPrefs?.demographics &&
        typeof serverPrefs.demographics === "object"
          ? serverPrefs.demographics
          : {};

      const lifestyleFromServer =
        serverPrefs?.lifestyle && typeof serverPrefs.lifestyle === "object"
          ? serverPrefs.lifestyle
          : {};

      const includeLifestyle = !skippedSteps?.[9];

      const nextPrefs = {
        ...serverPrefs,
        basics: nextBasics,
        demographics: {
          ...demographicsFromServer,
          ethnicity: ethnicity ? ethnicity.trim().slice(0, 80) : undefined,
          religion: religion ? religion.trim().slice(0, 80) : undefined,
          politics: politics ? politics.trim().slice(0, 80) : undefined,
        },
        lifestyle: includeLifestyle
          ? {
              ...lifestyleFromServer,
              workout,
              smoke,
              drink,
              diet,
            }
          : lifestyleFromServer,
        // interests are optional now; only write them if user actually picked something
        interests:
          !skippedSteps?.[11] && Array.isArray(interests) && interests.length
            ? interests
            : Array.isArray(serverPrefs?.interests)
              ? serverPrefs.interests
              : [],
        onboarding: {
          ...(serverPrefs?.onboarding &&
          typeof serverPrefs.onboarding === "object"
            ? serverPrefs.onboarding
            : {}),
          postQuizComplete: true,
          postQuizCompletedAt: new Date().toISOString(),
        },
      };

      if (nextPrefs?.demographics) {
        const d = { ...nextPrefs.demographics };
        if (d.ethnicity === undefined) delete d.ethnicity;
        if (d.religion === undefined) delete d.religion;
        if (d.politics === undefined) delete d.politics;
        nextPrefs.demographics = d;
      }

      const basePhotos = Array.isArray(profile?.photos) ? profile.photos : [];
      const primaryFromServer =
        typeof basePhotos?.[0] === "string" ? basePhotos[0] : "";
      const primary = primaryPhotoUrl || primaryFromServer;
      if (!primary) {
        throw new Error("Profile photo is required");
      }

      const mergedExtras = Array.isArray(extraPhotoUrls) ? extraPhotoUrls : [];
      const uniqueExtras = Array.from(new Set(mergedExtras)).filter(Boolean);
      const nextPhotos = [primary, ...uniqueExtras].slice(0, 6);

      // Age range is optional; if skipped, keep the stored prefs as-is.
      if (!skippedSteps?.[1]) {
        try {
          const raw = await AsyncStorage.getItem(DATING_PREFS_STORAGE_KEY);
          const existing = raw
            ? normalizePrefsFromStorage(JSON.parse(raw))
            : null;
          const merged = {
            ...(existing || {}),
            minAge: ageMin,
            maxAge: ageMax,
          };
          await AsyncStorage.setItem(
            DATING_PREFS_STORAGE_KEY,
            JSON.stringify(merged),
          );
        } catch (e) {
          console.error(e);
        }
      }

      const resp = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          // About is optional now; only write if they typed something.
          bio:
            !skippedSteps?.[10] && about
              ? about.trim().slice(0, 2000)
              : undefined,
          photos: nextPhotos,
          preferences: nextPrefs,
        }),
      });

      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        throw new Error(json?.error || "Could not save profile");
      }

      return resp.json();
    },
  });

  return {
    heightInches,
    setHeightInches,
    ageMin,
    setAgeMin,
    ageMax,
    setAgeMax,
    bornIn,
    setBornIn,
    jobTitle,
    setJobTitle,
    company,
    setCompany,
    primaryPhotoUrl,
    setPrimaryPhotoUrl,
    extraPhotoUrls,
    setExtraPhotoUrls,
    ethnicity,
    setEthnicity,
    religion,
    setReligion,
    politics,
    setPolitics,
    workout,
    setWorkout,
    smoke,
    setSmoke,
    drink,
    setDrink,
    diet,
    setDiet,
    about,
    setAbout,
    interests,
    setInterests,
    userId,
    localUserQuery,
    profileQuery,
    saveMutation,
  };
}
