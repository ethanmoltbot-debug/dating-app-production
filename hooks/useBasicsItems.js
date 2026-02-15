import { useMemo } from "react";
import {
  Calendar,
  User,
  Ruler,
  Briefcase,
  GraduationCap,
  Heart,
  MapPin,
} from "lucide-react-native";
import { formatGender } from "@/utils/profileFormatters";

export function useBasicsItems(
  profile,
  preferences,
  locationText,
  distanceLabel,
) {
  return useMemo(() => {
    const rawBasics =
      preferences?.basics && typeof preferences.basics === "object"
        ? preferences.basics
        : {};

    const height =
      rawBasics.height || preferences?.height || preferences?.heightCm || "";

    const jobTitle = String(rawBasics.jobTitle || "").trim();
    const company = String(rawBasics.company || "").trim();
    const workLegacy = String(rawBasics.work || preferences?.work || "").trim();

    const workCombined =
      jobTitle && company
        ? `${jobTitle} at ${company}`
        : jobTitle
          ? jobTitle
          : company
            ? `Works at ${company}`
            : workLegacy;

    const education = rawBasics.education || preferences?.education || "";
    const lookingFor = rawBasics.lookingFor || preferences?.lookingFor || "";
    const sexuality = String(
      rawBasics.sexuality || rawBasics.orientation || "",
    ).trim();

    const items = [];

    if (profile?.age) {
      items.push({ key: "age", icon: Calendar, text: `${profile.age}` });
    }

    if (profile?.gender) {
      const g = formatGender(profile.gender);
      if (g) {
        items.push({ key: "gender", icon: User, text: g });
      }
    }

    if (sexuality) {
      items.push({ key: "sexuality", icon: Heart, text: sexuality });
    }

    const combinedLocation = (() => {
      const loc = String(locationText || "").trim();
      const dist = String(distanceLabel || "").trim();
      if (loc && dist) {
        return `${loc} • ${dist}`;
      }
      return loc || dist;
    })();

    if (combinedLocation) {
      items.push({ key: "location", icon: MapPin, text: combinedLocation });
    }

    if (height) {
      items.push({ key: "height", icon: Ruler, text: String(height) });
    }

    if (workCombined) {
      items.push({ key: "work", icon: Briefcase, text: String(workCombined) });
    }

    if (education) {
      items.push({
        key: "education",
        icon: GraduationCap,
        text: String(education),
      });
    }

    if (lookingFor) {
      items.push({ key: "lookingFor", icon: Heart, text: String(lookingFor) });
    }

    return items;
  }, [preferences, profile?.age, profile?.gender, locationText, distanceLabel]);
}
