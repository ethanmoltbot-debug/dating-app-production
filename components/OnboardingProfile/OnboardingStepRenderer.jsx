import { View, Text, ActivityIndicator } from "react-native";
import { HeightStep } from "./HeightStep";
import { AgeRangeStep } from "./AgeRangeStep";
import { BornInStep } from "./BornInStep";
import { WorkStep } from "./WorkStep";
import { PrimaryPhotoStep } from "./PrimaryPhotoStep";
import { ExtraPhotosStep } from "./ExtraPhotosStep";
import { EthnicityStep, ReligionStep, PoliticsStep } from "./DemographicsStep";
import { LifestyleStep } from "./LifestyleStep";
import { AboutStep, InterestsStep } from "./AboutInterestsStep";

export function OnboardingStepRenderer({
  step,
  isLoading,
  userId,
  accent,
  labelStyle,
  inputStyle,
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
  handlePickPrimaryPhoto,
  extraPhotoUrls,
  handleAddExtraPhoto,
  removeExtraPhoto,
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
  toggleInterest,
  busy,
  validateAndNext,
}) {
  if (isLoading) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <ActivityIndicator color={accent} />
        <Text
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "#6B7280",
            fontWeight: "700",
          }}
        >
          Loading…
        </Text>
      </View>
    );
  }

  if (!Number.isFinite(userId)) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 10 }}>
        <Text style={{ fontSize: 16, color: "#111", fontWeight: "900" }}>
          Please sign in
        </Text>
        <Text style={{ marginTop: 6, color: "#6B7280", textAlign: "center" }}>
          We couldn't find your account on this device.
        </Text>
      </View>
    );
  }

  if (step === 0) {
    return (
      <HeightStep
        heightInches={heightInches}
        setHeightInches={setHeightInches}
        labelStyle={labelStyle}
      />
    );
  }

  if (step === 1) {
    return (
      <AgeRangeStep
        ageMin={ageMin}
        ageMax={ageMax}
        setAgeMin={setAgeMin}
        setAgeMax={setAgeMax}
        accent={accent}
        labelStyle={labelStyle}
      />
    );
  }

  if (step === 2) {
    return (
      <BornInStep
        bornIn={bornIn}
        setBornIn={setBornIn}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        validateAndNext={validateAndNext}
      />
    );
  }

  if (step === 3) {
    return (
      <WorkStep
        jobTitle={jobTitle}
        setJobTitle={setJobTitle}
        company={company}
        setCompany={setCompany}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        validateAndNext={validateAndNext}
      />
    );
  }

  if (step === 4) {
    return (
      <PrimaryPhotoStep
        primaryPhotoUrl={primaryPhotoUrl}
        handlePickPrimaryPhoto={handlePickPrimaryPhoto}
        busy={busy}
        labelStyle={labelStyle}
      />
    );
  }

  if (step === 5) {
    return (
      <ExtraPhotosStep
        extraPhotoUrls={extraPhotoUrls}
        handleAddExtraPhoto={handleAddExtraPhoto}
        removeExtraPhoto={removeExtraPhoto}
        busy={busy}
        labelStyle={labelStyle}
      />
    );
  }

  if (step === 6) {
    return (
      <EthnicityStep
        ethnicity={ethnicity}
        setEthnicity={setEthnicity}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
      />
    );
  }

  if (step === 7) {
    return (
      <ReligionStep
        religion={religion}
        setReligion={setReligion}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
      />
    );
  }

  if (step === 8) {
    return (
      <PoliticsStep
        politics={politics}
        setPolitics={setPolitics}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
      />
    );
  }

  if (step === 9) {
    return (
      <LifestyleStep
        workout={workout}
        setWorkout={setWorkout}
        smoke={smoke}
        setSmoke={setSmoke}
        drink={drink}
        setDrink={setDrink}
        diet={diet}
        setDiet={setDiet}
        labelStyle={labelStyle}
      />
    );
  }

  if (step === 10) {
    return (
      <AboutStep
        about={about}
        setAbout={setAbout}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
      />
    );
  }

  return (
    <InterestsStep
      interests={interests}
      toggleInterest={toggleInterest}
      labelStyle={labelStyle}
    />
  );
}
