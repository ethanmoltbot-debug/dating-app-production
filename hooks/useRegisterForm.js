import { useState, useMemo, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as RNImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import useUpload from "@/utils/useUpload";
import { normalizePhoneForApi, OTP_SUPPORTED_COUNTRIES } from "@/utils/phone";
import {
  parseBirthdateToIsoDate,
  computeAgeFromIsoDate,
  daysInMonth,
} from "@/utils/birthdateHelpers";
import { useAuthStore } from "@/utils/auth/store";

export function useRegisterForm(options = {}) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const now = useMemo(() => new Date(), []);

  const initialPhone =
    typeof options?.initialPhone === "string" ? options.initialPhone : "";
  const initialVerificationToken =
    typeof options?.initialVerificationToken === "string"
      ? options.initialVerificationToken
      : "";

  // If we already verified OTP on the login screen, start the onboarding flow at "Your name".
  const hasPreverifiedPhone = !!initialPhone && !!initialVerificationToken;
  const minStep = hasPreverifiedPhone ? 2 : 0;

  const [step, setStep] = useState(minStep);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState(() => now.getFullYear() - 25);
  const [birthMonth, setBirthMonth] = useState(() => now.getMonth() + 1);
  const [birthDay, setBirthDay] = useState(() => {
    const y = now.getFullYear() - 25;
    const m = now.getMonth() + 1;
    const maxD = daysInMonth(y, m);
    return Math.min(now.getDate(), maxD);
  });
  const [birthdateRaw, setBirthdateRaw] = useState(() => {
    const y = now.getFullYear() - 25;
    const m = now.getMonth() + 1;
    const d = Math.min(now.getDate(), daysInMonth(y, m));
    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  });
  const [gender, setGender] = useState(null);

  // OTP signup
  const [countryIso2, setCountryIso2] = useState("US");
  const [phone, setPhone] = useState(() =>
    hasPreverifiedPhone ? initialPhone : "",
  );
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(() => hasPreverifiedPhone);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verificationToken, setVerificationToken] = useState(() =>
    hasPreverifiedPhone ? initialVerificationToken : "",
  );

  const [selectedVerificationImage, setSelectedVerificationImage] =
    useState(null);
  const [loading, setLoading] = useState(false);

  const [upload, { loading: uploadLoading }] = useUpload();
  const isBusy = loading || uploadLoading || sendingOtp || verifyingOtp;

  const createCenteredSquarePreview = useCallback(async (asset) => {
    try {
      if (!asset?.uri) return null;

      const manipulatorFn =
        ImageManipulator.manipulateAsync || ImageManipulator.manipulateImage;

      if (typeof manipulatorFn !== "function") {
        return null;
      }

      // First, force a normalize pass so we get reliable width/height (and EXIF orientation is applied).
      const normalized = await manipulatorFn(asset.uri, [{ rotate: 0 }], {
        compress: 1,
        format: ImageManipulator?.SaveFormat?.JPEG,
      });

      const width = Number(normalized?.width);
      const height = Number(normalized?.height);
      const uri = normalized?.uri || asset.uri;

      if (!Number.isFinite(width) || !Number.isFinite(height) || !uri) {
        return null;
      }

      const side = Math.max(1, Math.floor(Math.min(width, height)));
      const baseX = Math.floor((width - side) / 2);
      const baseY = Math.floor((height - side) / 2);

      // Bias more downward so the chin is less likely to be cut off in the square thumbnail.
      const biasDownPx = Math.floor(side * 0.18);

      const originX = Math.max(0, Math.min(width - side, baseX));
      const originY = Math.max(0, Math.min(height - side, baseY + biasDownPx));

      const preview = await manipulatorFn(
        uri,
        [
          {
            crop: {
              originX,
              originY,
              width: side,
              height: side,
            },
          },
          {
            resize: {
              width: 512,
              height: 512,
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator?.SaveFormat?.JPEG,
        },
      );

      return preview?.uri || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, []);

  const pickVerificationPhoto = useCallback(async () => {
    try {
      const perm = await RNImagePicker.requestCameraPermissionsAsync();
      const granted = perm?.status === "granted";

      if (granted) {
        const result = await RNImagePicker.launchCameraAsync({
          mediaTypes: RNImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          exif: true,
          quality: 0.9,
        });

        if (!result.canceled) {
          const asset = result.assets[0];
          const previewUri = await createCenteredSquarePreview(asset);
          setSelectedVerificationImage({
            ...asset,
            previewUri: previewUri || undefined,
          });
        }
        return;
      }

      const libPerm = await RNImagePicker.requestMediaLibraryPermissionsAsync();
      if (libPerm?.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow camera or photo library access to upload a verification photo.",
        );
        return;
      }

      const result = await RNImagePicker.launchImageLibraryAsync({
        mediaTypes: RNImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        exif: true,
        quality: 0.9,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const previewUri = await createCenteredSquarePreview(asset);
        setSelectedVerificationImage({
          ...asset,
          previewUri: previewUri || undefined,
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not open camera/photos.");
    }
  }, [createCenteredSquarePreview]);

  const sendOtp = useCallback(async () => {
    const countryKey = String(countryIso2 || "").toUpperCase();
    const isSupported = OTP_SUPPORTED_COUNTRIES.includes(countryKey);
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

    setSendingOtp(true);
    try {
      const resp = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });

      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        throw new Error(json?.error || "Could not send code");
      }

      // reset any previous verification state
      setVerificationToken("");
      setCode("");
      setOtpSent(true);

      return true;
    } catch (e) {
      console.error(e);
      Alert.alert("Could not send", e?.message || "Please try again.");
      return false;
    } finally {
      setSendingOtp(false);
    }
  }, [countryIso2, phone]);

  const verifyOtpForSignup = useCallback(async () => {
    const countryKey = String(countryIso2 || "").toUpperCase();
    const isSupported = OTP_SUPPORTED_COUNTRIES.includes(countryKey);
    if (!isSupported) {
      Alert.alert(
        "Not supported yet",
        "SMS verification is currently available for United States, Canada, United Kingdom, and Australia only.",
      );
      return false;
    }

    const normalized = normalizePhoneForApi(phone, countryIso2);
    const codeTrimmed = String(code || "").trim();

    if (!normalized) {
      Alert.alert("Missing info", "Please enter your phone number");
      return false;
    }

    if (!codeTrimmed || codeTrimmed.length < 4) {
      Alert.alert("Missing info", "Please enter the code we texted you");
      return false;
    }

    setVerifyingOtp(true);
    try {
      const resp = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, code: codeTrimmed }),
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok) {
        const errMsg = json?.error || "Invalid code";
        throw new Error(errMsg);
      }

      if (json?.user) {
        Alert.alert(
          "Account exists",
          "This phone number already has an account. Please sign in instead.",
          [{ text: "OK", onPress: () => router.replace("/auth/login") }],
        );
        return false;
      }

      if (json?.needsRegistration) {
        setPhone(normalized);
        setVerificationToken(String(json?.verificationToken || ""));
        setStep(2);
        return true;
      }

      throw new Error("Unexpected response verifying code");
    } catch (e) {
      console.error(e);
      Alert.alert("Could not verify", e?.message || "Please try again.");
      return false;
    } finally {
      setVerifyingOtp(false);
    }
  }, [code, countryIso2, phone, router]);

  const handleRegister = useCallback(async () => {
    const birthdateIso = parseBirthdateToIsoDate(birthdateRaw);
    const age = birthdateIso ? computeAgeFromIsoDate(birthdateIso) : null;

    const phoneTrimmed = String(phone || "").trim();
    const tokenTrimmed = String(verificationToken || "").trim();

    if (
      !tokenTrimmed ||
      !name ||
      !phoneTrimmed ||
      !birthdateIso ||
      !Number.isFinite(age) ||
      !gender ||
      !selectedVerificationImage
    ) {
      Alert.alert("Error", "Please complete all steps");
      return;
    }

    setLoading(true);
    try {
      // Force JPEG for iOS/TestFlight reliability (avoids HEIC upload edge cases).
      let assetToUpload = selectedVerificationImage;
      try {
        const fn =
          ImageManipulator.manipulateAsync || ImageManipulator.manipulateImage;

        if (typeof fn === "function" && selectedVerificationImage?.uri) {
          const manipulated = await fn(
            selectedVerificationImage.uri,
            [{ resize: { width: 1440 } }],
            {
              compress: 0.86,
              format: ImageManipulator?.SaveFormat?.JPEG,
            },
          );

          assetToUpload = {
            uri: manipulated?.uri || selectedVerificationImage.uri,
            name: `verification-${Date.now()}.jpg`,
            mimeType: "image/jpeg",
            type: "image",
          };
        }
      } catch (e) {
        console.error("verification photo manipulation failed", e);
        assetToUpload = selectedVerificationImage;
      }

      const uploadRes = await upload({
        reactNativeAsset: assetToUpload,
      });
      if (uploadRes?.error) {
        throw new Error(String(uploadRes.error));
      }

      const verificationPhotoUrl = uploadRes?.url;
      if (!verificationPhotoUrl) {
        throw new Error("Upload failed");
      }

      const response = await fetch("/api/auth/otp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneTrimmed,
          verificationToken: tokenTrimmed,
          name,
          birthdate: birthdateIso,
          gender,
          verificationPhotoUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Registration failed");
      }

      const data = await response.json();
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // NEW: store apiJwt so purchases + date-credit claims update instantly.
      if (data?.apiJwt) {
        setAuth({
          jwt: String(data.apiJwt),
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        });
      }

      router.replace("/screening/reviewing?next=/screening/gate");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }, [
    birthdateRaw,
    gender,
    name,
    phone,
    router,
    selectedVerificationImage,
    upload,
    verificationToken,
    setAuth,
  ]);

  const validateAndNext = useCallback(async () => {
    if (isBusy) return;

    // STEP 0: phone number (send OTP and move to code screen)
    if (step === 0) {
      const ok = await sendOtp();
      if (ok) {
        setStep(1);
      }
      return;
    }

    // STEP 1: OTP code verification
    if (step === 1) {
      verifyOtpForSignup();
      return;
    }

    // STEP 2: name
    if (step === 2) {
      const trimmed = name.trim();
      if (!trimmed) {
        Alert.alert("Missing info", "Please enter your name");
        return;
      }
      if (trimmed.length < 2) {
        Alert.alert("Too short", "Please enter your full first name");
        return;
      }
      setName(trimmed);
      setStep(3);
      return;
    }

    // STEP 3: birthday
    if (step === 3) {
      const maxD = daysInMonth(birthYear, birthMonth);
      const safeDay = Math.min(birthDay, maxD);
      const isoFromPicker = `${String(birthYear).padStart(4, "0")}-${String(birthMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;

      const isoDate = parseBirthdateToIsoDate(isoFromPicker);
      if (!isoDate) {
        Alert.alert("Check birthday", "Please select a valid birthday");
        return;
      }

      const age = computeAgeFromIsoDate(isoDate);
      if (!Number.isFinite(age)) {
        Alert.alert("Check birthday", "Please enter a valid birthday");
        return;
      }

      if (age < 18) {
        Alert.alert("Not eligible", "You must be 18+ to use Wifey");
        return;
      }

      if (age > 99) {
        Alert.alert("Check birthday", "Please enter a valid birthday");
        return;
      }

      setBirthDay(safeDay);
      setBirthdateRaw(isoDate);
      setStep(4);
      return;
    }

    // STEP 4: gender
    if (step === 4) {
      if (gender !== "Male" && gender !== "Female") {
        Alert.alert("Missing info", "Please select Male or Female");
        return;
      }
      setStep(5);
      return;
    }

    // STEP 5: verification photo + submit
    if (step === 5) {
      if (!selectedVerificationImage) {
        Alert.alert(
          "Verification required",
          "Please take a quick selfie to verify your profile.",
        );
        return;
      }
      handleRegister();
    }
  }, [
    birthDay,
    birthMonth,
    birthYear,
    gender,
    handleRegister,
    isBusy,
    name,
    selectedVerificationImage,
    sendOtp,
    step,
    verifyOtpForSignup,
  ]);

  const goBack = useCallback(() => {
    if (isBusy) return;

    if (step === minStep) {
      router.replace("/auth/login");
      return;
    }

    setStep((s) => Math.max(minStep, s - 1));
  }, [isBusy, minStep, router, step]);

  return {
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
    otpSent,
    sendingOtp,
    verifyingOtp,
    sendOtp,

    selectedVerificationImage,
    isBusy,
    pickVerificationPhoto,
    validateAndNext,
    goBack,
  };
}
