import { useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { SoftBlobsBackground } from "@/components/Register/SoftBlobsBackground";
import { RegisterHeader } from "@/components/Register/RegisterHeader";
import { ProgressBar } from "@/components/Register/ProgressBar";
import { StepPhoneNumber } from "@/components/Register/StepPhoneNumber";
import { StepOtpCode } from "@/components/Register/StepOtpCode";
import { StepName } from "@/components/Register/StepName";
import { StepBirthday } from "@/components/Register/StepBirthday";
import { StepGender } from "@/components/Register/StepGender";
import { StepVerification } from "@/components/Register/StepVerification";
import { BirthdayPickerModal } from "@/components/Register/BirthdayPickerModal";
import { RegisterActions } from "@/components/Register/RegisterActions";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { useBirthdayPicker } from "@/hooks/useBirthdayPicker";
import { formatBirthdateLabel } from "@/utils/birthdateHelpers";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const preverifiedPhone = useMemo(() => {
    const phone = params?.phone;
    if (typeof phone === "string") return phone;
    return "";
  }, [params?.phone]);

  const preverifiedToken = useMemo(() => {
    const token = params?.verificationToken;
    if (typeof token === "string") return token;
    return "";
  }, [params?.verificationToken]);

  const hasPreverifiedPhone = useMemo(() => {
    return !!preverifiedPhone && !!preverifiedToken;
  }, [preverifiedPhone, preverifiedToken]);

  const BG_GRADIENT = useMemo(() => ["#F7EEFF", "#F2F7FF", "#FFF1F7"], []);
  const CTA_GRADIENT = useMemo(() => ["#FF4FD8", "#7C3AED"], []);

  const {
    step,
    name,
    setName,
    birthYear,
    setBirthYear,
    birthMonth,
    setBirthMonth,
    birthDay,
    setBirthDay,
    birthdateRaw,
    setBirthdateRaw,
    gender,
    setGender,
    countryIso2,
    setCountryIso2,
    phone,
    setPhone,
    code,
    setCode,
    sendingOtp,
    verifyingOtp,
    sendOtp,
    selectedVerificationImage,
    isBusy,
    pickVerificationPhoto,
    validateAndNext,
    goBack,
  } = useRegisterForm({
    initialPhone: preverifiedPhone,
    initialVerificationToken: preverifiedToken,
  });

  const {
    birthPickerOpen,
    draftBirthYear,
    setDraftBirthYear,
    draftBirthMonth,
    setDraftBirthMonth,
    draftBirthDay,
    setDraftBirthDay,
    openBirthPicker,
    cancelBirthPicker,
    confirmBirthPicker,
  } = useBirthdayPicker(
    birthYear,
    birthMonth,
    birthDay,
    setBirthYear,
    setBirthMonth,
    setBirthDay,
    setBirthdateRaw,
    isBusy,
  );

  // When the phone is already verified on the "sign in" screen, the register flow starts at step 2.
  // For the progress bar, we show a shortened 4-step onboarding flow.
  const totalSteps = hasPreverifiedPhone ? 4 : 6;
  const progressStep = hasPreverifiedPhone ? Math.max(0, step - 2) : step;

  const stepTitle = !hasPreverifiedPhone
    ? step === 0
      ? "Your phone"
      : step === 1
        ? "Verification code"
        : step === 2
          ? "Your name"
          : step === 3
            ? "Your birthday"
            : step === 4
              ? "Your gender"
              : "Photo verification"
    : step === 2
      ? "Your name"
      : step === 3
        ? "Your birthday"
        : step === 4
          ? "Your gender"
          : "Photo verification";

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

  const primaryLabel = step === 5 ? "Create account" : "Continue";

  const busyLabel = useMemo(() => {
    if (sendingOtp) return "Sending…";
    if (verifyingOtp) return "Verifying…";
    if (step === 5) return "Creating…";
    return "Loading…";
  }, [sendingOtp, step, verifyingOtp]);

  const birthdateLabel = useMemo(
    () => formatBirthdateLabel(birthdateRaw),
    [birthdateRaw],
  );

  const phoneLabel = useMemo(() => {
    const trimmed = String(phone || "").trim();
    return trimmed ? trimmed : null;
  }, [phone]);

  // Hide the "Already have an account? Sign In" row once the user is past OTP,
  // especially when they arrived here from the unified login flow.
  const hideSecondary = useMemo(() => {
    if (hasPreverifiedPhone) return true;
    return step >= 2;
  }, [hasPreverifiedPhone, step]);

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

      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
        <RegisterHeader onBack={goBack} isBusy={isBusy} />

        <ProgressBar
          step={progressStep}
          totalSteps={totalSteps}
          stepTitle={stepTitle}
        />

        {/* Body */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={cardStyle}>
            {step === 0 ? (
              <StepPhoneNumber
                countryIso2={countryIso2}
                setCountryIso2={setCountryIso2}
                phone={phone}
                setPhone={setPhone}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />
            ) : step === 1 ? (
              <StepOtpCode
                phoneLabel={phoneLabel}
                code={code}
                setCode={setCode}
                onResend={sendOtp}
                sending={sendingOtp}
                verifying={verifyingOtp}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />
            ) : step === 2 ? (
              <StepName
                name={name}
                setName={setName}
                onSubmit={validateAndNext}
                inputStyle={inputStyle}
              />
            ) : step === 3 ? (
              <StepBirthday
                birthdateLabel={birthdateLabel}
                onOpenPicker={openBirthPicker}
                isBusy={isBusy}
              />
            ) : step === 4 ? (
              <StepGender
                gender={gender}
                setGender={setGender}
                isBusy={isBusy}
              />
            ) : (
              <StepVerification
                selectedImage={selectedVerificationImage}
                onPickPhoto={pickVerificationPhoto}
                isBusy={isBusy}
              />
            )}
          </View>
        </View>

        <BirthdayPickerModal
          visible={birthPickerOpen}
          onCancel={cancelBirthPicker}
          onConfirm={confirmBirthPicker}
          draftYear={draftBirthYear}
          setDraftYear={setDraftBirthYear}
          draftMonth={draftBirthMonth}
          setDraftMonth={setDraftBirthMonth}
          draftDay={draftBirthDay}
          setDraftDay={setDraftBirthDay}
          insets={insets}
        />

        <RegisterActions
          onContinue={validateAndNext}
          onSignIn={hideSecondary ? null : () => router.replace("/auth/login")}
          secondaryHidden={hideSecondary}
          isBusy={isBusy}
          busyLabel={busyLabel}
          primaryLabel={primaryLabel}
          insets={insets}
          ctaGradient={CTA_GRADIENT}
        />
      </KeyboardAvoidingAnimatedView>
    </View>
  );
}
