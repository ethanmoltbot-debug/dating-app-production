import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// We keep a tiny "fallback" copy of the OTP user.
// Primary: SecureStore (best for persistence)
// Secondary fallback: AsyncStorage (some preview environments can be flaky with SecureStore)
// This protects against cases where AsyncStorage("user") gets wiped/cleared unexpectedly,
// and fixes "Missing user ID" issues.
//
// NOTE: We purposely do NOT store any secrets here (OTP flow doesn't have a JWT).
const OTP_USER_KEY = "wifey:otp-user:v1";
const OTP_USER_ASYNC_KEY = "wifey:otp-user:async:v1";

export async function setOtpUser(user) {
  try {
    if (!user || typeof user !== "object") {
      try {
        await SecureStore.deleteItemAsync(OTP_USER_KEY);
      } catch (e) {
        console.error(e);
      }
      try {
        await AsyncStorage.removeItem(OTP_USER_ASYNC_KEY);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    // Store only the fields we need to boot the app and fetch profile.
    const minimal = {
      id: user.id,
      email: user.email,
      status: user.status,
      screeningPhase: user.screeningPhase,
      cooldownUntil: user.cooldownUntil,
    };

    // Best-effort write to both stores.
    try {
      await SecureStore.setItemAsync(OTP_USER_KEY, JSON.stringify(minimal));
    } catch (e) {
      console.error(e);
    }

    try {
      await AsyncStorage.setItem(OTP_USER_ASYNC_KEY, JSON.stringify(minimal));
    } catch (e) {
      console.error(e);
    }
  } catch (e) {
    // Ignore top-level store failures.
    console.error(e);
  }
}

export async function getOtpUser() {
  // 1) SecureStore
  try {
    const raw = await SecureStore.getItemAsync(OTP_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }

  // 2) AsyncStorage fallback
  try {
    const raw = await AsyncStorage.getItem(OTP_USER_ASYNC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function clearOtpUser() {
  try {
    await SecureStore.deleteItemAsync(OTP_USER_KEY);
  } catch (e) {
    console.error(e);
  }

  try {
    await AsyncStorage.removeItem(OTP_USER_ASYNC_KEY);
  } catch (e) {
    console.error(e);
  }
}
