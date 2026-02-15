import { useCallback, useMemo, useState } from "react";
import { View, Text, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { StepPhoneNumber } from "@/components/Register/StepPhoneNumber";
import { StepOtpCode } from "@/components/Register/StepOtpCode";
import { RegisterActions } from "@/components/Register/RegisterActions";
import { normalizePhoneForApi, OTP_SUPPORTED_COUNTRIES } from "@/utils/phone";
import { useAuthStore } from "@/utils/auth/store";

function SoftBlobsBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -80,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: "rgba(255, 79, 216, 0.16)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 120,
          right: -110,
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: "rgba(124, 58, 237, 0.14)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -120,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: "rgba(99, 179, 237, 0.16)",
        }}
      />
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  // 0 = phone entry, 1 = code entry
  const [step, setStep] = useState(0);

  const [countryIso2, setCountryIso2] = useState("US");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isBusy = sending || verifying;

  const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];
  const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

  const isSupported = useMemo(() => {
    const key = String(countryIso2 || "").toUpperCase();
    return OTP_SUPPORTED_COUNTRIES.includes(key);
  }, [countryIso2]);

  const labelStyle = useMemo(() => {
    return {
      fontSize: 13,
      color: "#6B7280",
      marginBottom: 8,
      fontWeight: "800",
    };
  }, []);

  const inputStyle = useMemo(() => {
    return {
      backgroundColor: "rgba(17,17,17,0.04)",
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      borderWidth: 1,
      borderColor: "rgba(17,17,17,0.08)",
      color: "#111",
      fontWeight: "700",
    };
  }, []);

  const phoneForApi = useMemo(() => {
    if (normalizedPhone) return normalizedPhone;
    return normalizePhoneForApi(phone, countryIso2);
  }, [countryIso2, normalizedPhone, phone]);

  const sendCode = useCallback(async () => {
    if (!isSupported) {
      Alert.alert(
        "Not supported yet",
        "SMS verification is currently available for United States, Canada, United Kingdom, and Australia only.",
      );
      return false;
    }

    const normalized = normalizePhoneForApi(phone, countryIso2);
    if (!normalized) {
      Alert.alert("Missing info", "Please enter your phone number");
      return false;
    }

    setSending(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || "Could not send code");
      }

      setNormalizedPhone(normalized);
      setCode("");
      setStep(1);
      return true;
    } catch (e) {
      console.error(e);
      Alert.alert("Could not send", e?.message || "Please try again.");
      return false;
    } finally {
      setSending(false);
    }
  }, [countryIso2, isSupported, phone]);

  const resendCode = useCallback(async () => {
    if (!phoneForApi) {
      Alert.alert("Missing info", "Please enter your phone number");
      setStep(0);
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneForApi }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || "Could not resend code");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Could not resend", e?.message || "Please try again.");
    } finally {
      setSending(false);
    }
  }, [phoneForApi]);

  const verifyCode = useCallback(async () => {
    if (!phoneForApi) {
      Alert.alert("Missing info", "Please enter your phone number");
      setStep(0);
      return;
    }

    const codeTrimmed = String(code || "").trim();
    if (!codeTrimmed) {
      Alert.alert("Missing info", "Please enter the code we texted you");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneForApi, code: codeTrimmed }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const respCode = data?.code;

        if (
          response.status === 409 &&
          respCode === "ACCOUNT_PENDING_DELETION"
        ) {
          const scheduledFor = data?.deleteScheduledFor;
          const scheduledText = scheduledFor
            ? new Date(scheduledFor).toLocaleDateString()
            : null;

          const subtitle = scheduledText
            ? `Your account is scheduled for deletion on ${scheduledText}. You can restore it now.`
            : "Your account is scheduled for deletion. You can restore it now.";

          Alert.alert("Restore account?", subtitle, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Restore",
              onPress: async () => {
                try {
                  const restoreResp = await fetch("/api/users/delete/cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: data?.userId }),
                  });

                  if (!restoreResp.ok) {
                    throw new Error(
                      `When calling /api/users/delete/cancel, the response was [${restoreResp.status}] ${restoreResp.statusText}`,
                    );
                  }

                  Alert.alert(
                    "Restored",
                    "Your account has been restored. Please sign in again.",
                  );
                } catch (e) {
                  console.error(e);
                  Alert.alert(
                    "Could not restore",
                    e?.message || "Please try again.",
                  );
                }
              },
            },
          ]);
          return;
        }

        if (response.status === 410 && respCode === "ACCOUNT_DELETED") {
          Alert.alert(
            "Account deleted",
            data?.error || "This account was deleted.",
          );
          return;
        }

        throw new Error(data?.error || "Invalid code");
      }

      // Unified flow: if there is no account yet, jump straight into onboarding
      // using the verificationToken so the user does NOT have to request a second code.
      if (data?.needsRegistration) {
        const token = String(data?.verificationToken || "");
        const verifiedPhone = String(data?.phone || phoneForApi);

        const url = `/auth/register?phone=${encodeURIComponent(verifiedPhone)}&verificationToken=${encodeURIComponent(token)}`;
        router.replace(url);
        return;
      }

      if (!data?.user) {
        throw new Error("Sign in failed");
      }

      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // NEW: store apiJwt (OTP auth) so purchases + date-credit claims can be processed instantly.
      if (data?.apiJwt) {
        setAuth({
          jwt: String(data.apiJwt),
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        });
      }

      if (data.user.status === "COOLDOWN") {
        router.replace("/screening/cooldown");
      } else if (data.user.status === "PENDING_SCREENING") {
        router.replace("/screening/gate");
      } else if (data.user.status === "APPROVED") {
        // IMPORTANT: route groups like (tabs) are not part of the URL
        router.replace("/home");
      } else {
        router.replace("/screening/gate");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e?.message || "Could not sign in");
    } finally {
      setVerifying(false);
    }
  }, [code, phoneForApi, router, setAuth]);

  const primaryLabel = useMemo(() => {
    return step === 0 ? "Continue" : "Continue";
  }, [step]);

  const busyLabel = useMemo(() => {
    if (sending) return "Sending…";
    if (verifying) return "Verifying…";
    return "Loading…";
  }, [sending, verifying]);

  const onContinue = useCallback(() => {
    if (step === 0) {
      sendCode();
      return;
    }

    verifyCode();
  }, [sendCode, step, verifyCode]);

  const phoneLabel = useMemo(() => {
    const trimmed = String(phoneForApi || "").trim();
    return trimmed ? trimmed : null;
  }, [phoneForApi]);

  const cardStyle = useMemo(() => {
    return {
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
  }, []);

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
        <View
          style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}
        >
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 44,
                fontWeight: "900",
                color: "#111",
                letterSpacing: 1,
              }}
            >
              Wifey
            </Text>
            <Text style={{ fontSize: 15, color: "#6B7280", marginTop: 6 }}>
              Continue with your phone
            </Text>
          </View>

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
            ) : (
              <StepOtpCode
                phoneLabel={phoneLabel}
                code={code}
                setCode={setCode}
                onResend={resendCode}
                onChangeNumber={() => {
                  if (isBusy) return;
                  setCode("");
                  setNormalizedPhone("");
                  setStep(0);
                }}
                sending={sending}
                verifying={verifying}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />
            )}
          </View>
        </View>

        {/* Reuse the register action bar for a consistent CTA button */}
        <RegisterActions
          onContinue={onContinue}
          onSignIn={null}
          secondaryHidden={true}
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
