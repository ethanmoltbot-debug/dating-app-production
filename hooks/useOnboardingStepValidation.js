import { useCallback } from "react";
import { Alert } from "react-native";

export function useOnboardingStepValidation({
  step,
  setStep,
  totalSteps,
  heightInches,
  ageMin,
  ageMax,
  bornIn,
  setBornIn,
  jobTitle,
  setJobTitle,
  company,
  setCompany,
  primaryPhotoUrl,
  about,
  interests,
  saveMutation,
  router,
  busy,
  skippedSteps,
  setSkippedSteps,
}) {
  const goNext = useCallback(() => {
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  }, [setStep, totalSteps]);

  const skipCurrentStep = useCallback(() => {
    if (busy) return;

    setSkippedSteps((prev) => {
      const safePrev = prev && typeof prev === "object" ? prev : {};
      return { ...safePrev, [step]: true };
    });

    if (step >= totalSteps - 1) {
      // last screen skip = finish
      saveMutation.mutate(
        { skippedSteps: { ...(skippedSteps || {}), [step]: true } },
        {
          onSuccess: () => {
            // After finishing onboarding, ask for notifications + location.
            // (Split into two screens: notifications first, then location.)
            router.replace("/onboarding/notifications");
          },
          onError: (e) => {
            console.error(e);
            Alert.alert("Could not save", e?.message || "Please try again.");
          },
        },
      );
      return;
    }

    goNext();
  }, [
    busy,
    goNext,
    router,
    saveMutation,
    setSkippedSteps,
    skippedSteps,
    step,
    totalSteps,
  ]);

  const validateAndNext = useCallback(() => {
    if (busy) return;

    // Only required: height + profile photo.
    if (step === 0) {
      if (!heightInches) {
        Alert.alert("Missing info", "Please select your height");
        return;
      }
      goNext();
      return;
    }

    if (step === 4) {
      if (!primaryPhotoUrl) {
        Alert.alert("Required", "Please add a profile photo to continue");
        return;
      }
      goNext();
      return;
    }

    // Optional screens: we still lightly clean up input if present, but we do not block.
    if (step === 2) {
      const trimmed = String(bornIn || "").trim();
      if (trimmed) {
        setBornIn(trimmed);
      }
      goNext();
      return;
    }

    if (step === 3) {
      const jt = String(jobTitle || "").trim();
      const co = String(company || "").trim();
      if (jt) setJobTitle(jt);
      if (co) setCompany(co);
      goNext();
      return;
    }

    if (step < totalSteps - 1) {
      goNext();
      return;
    }

    // Last step: save and finish (About + interests are optional now)
    saveMutation.mutate(
      { skippedSteps },
      {
        onSuccess: () => {
          // After finishing onboarding, ask for notifications + location.
          // (Split into two screens: notifications first, then location.)
          router.replace("/onboarding/notifications");
        },
        onError: (e) => {
          console.error(e);
          Alert.alert("Could not save", e?.message || "Please try again.");
        },
      },
    );
  }, [
    about,
    ageMax,
    ageMin,
    bornIn,
    busy,
    company,
    goNext,
    heightInches,
    interests,
    jobTitle,
    primaryPhotoUrl,
    router,
    saveMutation,
    setBornIn,
    setCompany,
    setJobTitle,
    skippedSteps,
    step,
    totalSteps,
  ]);

  return { validateAndNext, skipCurrentStep };
}
