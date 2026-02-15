import { useCallback, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RegisterHeader } from "@/components/Register/RegisterHeader";
import { ProgressBar } from "@/components/Register/ProgressBar";
import { SoftBlobsBackground } from "@/components/OnboardingProfile/SoftBlobsBackground";
import { OnboardingStepRenderer } from "@/components/OnboardingProfile/OnboardingStepRenderer";
import { OnboardingFooter } from "@/components/OnboardingProfile/OnboardingFooter";
import { useOnboardingProfile } from "@/hooks/useOnboardingProfile";
import { useOnboardingPhotoActions } from "@/hooks/useOnboardingPhotoActions";
import { useOnboardingStepValidation } from "@/hooks/useOnboardingStepValidation";

export default function PostQuizOnboardingProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const BG_GRADIENT = useMemo(() => ["#F7EEFF", "#F2F7FF", "#FFF1F7"], []);
  const CTA_GRADIENT = useMemo(() => ["#FF4FD8", "#7C3AED"], []);
  const accent = "#7C3AED";

  const [step, setStep] = useState(0);
  const [skippedSteps, setSkippedSteps] = useState({});

  const {
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
  } = useOnboardingProfile();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const readInterestPicker = async () => {
        try {
          const raw = await AsyncStorage.getItem("interest_picker_result");
          if (!raw) return;
          await AsyncStorage.removeItem("interest_picker_result");
          if (cancelled) return;
          const parsed = JSON.parse(raw);
          const next = Array.isArray(parsed?.interests) ? parsed.interests : [];
          setInterests(next);
        } catch (e) {
          console.error(e);
        }
      };

      readInterestPicker();

      return () => {
        cancelled = true;
      };
    }, [setInterests]),
  );

  const {
    uploadLoading,
    handlePickPrimaryPhoto,
    handleAddExtraPhoto,
    removeExtraPhoto,
  } = useOnboardingPhotoActions({
    setPrimaryPhotoUrl,
    setExtraPhotoUrls,
    userId,
  });

  const toggleInterest = useCallback(
    (label) => {
      setInterests((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const exists = safePrev.includes(label);
        if (exists) {
          return safePrev.filter((x) => x !== label);
        }
        return [...safePrev, label].slice(0, 12);
      });
    },
    [setInterests],
  );

  const totalSteps = 12;

  const busy =
    localUserQuery.isLoading ||
    profileQuery.isLoading ||
    saveMutation.isPending ||
    uploadLoading;

  const { validateAndNext, skipCurrentStep } = useOnboardingStepValidation({
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
  });

  const onBack = useCallback(() => {
    if (busy) return;

    if (step === 0) {
      router.replace("/screening/outcome?result=APPROVED");
      return;
    }

    setStep((s) => Math.max(0, s - 1));
  }, [busy, router, step]);

  const stepTitle =
    step === 0
      ? "Your height"
      : step === 1
        ? "Age range"
        : step === 2
          ? "Where were you born?"
          : step === 3
            ? "Work"
            : step === 4
              ? "Profile photo"
              : step === 5
                ? "More photos"
                : step === 6
                  ? "Ethnicity"
                  : step === 7
                    ? "Religion"
                    : step === 8
                      ? "Political views"
                      : step === 9
                        ? "Lifestyle"
                        : step === 10
                          ? "About"
                          : "Interests";

  const headerHint = step < totalSteps - 1 ? "A few quick questions" : "";

  const cardStyle = {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.06)",
  };

  const labelStyle = {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "800",
  };

  const inputStyle = {
    backgroundColor: "rgba(17,17,17,0.04)",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    color: "#111",
    fontWeight: "700",
  };

  const isLoading = localUserQuery.isLoading || profileQuery.isLoading;
  const allowSkip = step !== 0 && step !== 4;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      <RegisterHeader onBack={onBack} isBusy={busy} />

      <ProgressBar step={step} totalSteps={totalSteps} stepTitle={stepTitle} />

      {headerHint ? (
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            {headerHint}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={cardStyle}>
          <OnboardingStepRenderer
            step={step}
            isLoading={isLoading}
            userId={userId}
            accent={accent}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
            heightInches={heightInches}
            setHeightInches={setHeightInches}
            ageMin={ageMin}
            setAgeMin={setAgeMin}
            ageMax={ageMax}
            setAgeMax={setAgeMax}
            bornIn={bornIn}
            setBornIn={setBornIn}
            jobTitle={jobTitle}
            setJobTitle={setJobTitle}
            company={company}
            setCompany={setCompany}
            primaryPhotoUrl={primaryPhotoUrl}
            handlePickPrimaryPhoto={handlePickPrimaryPhoto}
            extraPhotoUrls={extraPhotoUrls}
            handleAddExtraPhoto={handleAddExtraPhoto}
            removeExtraPhoto={removeExtraPhoto}
            ethnicity={ethnicity}
            setEthnicity={setEthnicity}
            religion={religion}
            setReligion={setReligion}
            politics={politics}
            setPolitics={setPolitics}
            workout={workout}
            setWorkout={setWorkout}
            smoke={smoke}
            setSmoke={setSmoke}
            drink={drink}
            setDrink={setDrink}
            diet={diet}
            setDiet={setDiet}
            about={about}
            setAbout={setAbout}
            interests={interests}
            toggleInterest={toggleInterest}
            busy={busy}
            validateAndNext={validateAndNext}
          />
        </View>
      </View>

      <OnboardingFooter
        step={step}
        totalSteps={totalSteps}
        validateAndNext={validateAndNext}
        busy={busy}
        saveMutationPending={saveMutation.isPending}
        uploadLoading={uploadLoading}
        insets={insets}
        CTA_GRADIENT={CTA_GRADIENT}
        allowSkip={allowSkip}
        onSkip={skipCurrentStep}
      />
    </View>
  );
}
