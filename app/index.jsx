import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

function safeJsonObject(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore
  }
  return {};
}

function isPostQuizOnboardingComplete(profile) {
  const prefs = safeJsonObject(profile?.preferences);
  return prefs?.onboarding?.postQuizComplete === true;
}

function isActiveCooldown(status, cooldownUntil) {
  if (status !== "COOLDOWN") return false;
  if (!cooldownUntil) return false;
  const d = new Date(cooldownUntil);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() < d.getTime();
}

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState("/auth/login");

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        // NEW behavior:
        // If there is no signed-in user on the device, ALWAYS show onboarding first.
        // (This avoids dropping users directly onto auth screens and keeps the "Wifey" intro consistent.)
        const userRaw = await AsyncStorage.getItem("user");
        if (!userRaw) {
          if (!cancelled) setTarget("/onboarding");
          return;
        }

        // If the intro hasn't been seen yet, show onboarding (even if a user exists).
        const onboardingSeen = await AsyncStorage.getItem("onboarding_seen");
        if (!onboardingSeen || onboardingSeen !== "true") {
          if (!cancelled) setTarget("/onboarding");
          return;
        }

        const user = JSON.parse(userRaw);
        const response = await fetch(`/api/users/me?userId=${user.id}`);

        // IMPORTANT: if the user was deleted in admin, we must clear local cache.
        if (response.status === 404) {
          try {
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("onboarding_seen");
          } catch (e) {
            console.error(e);
          }
          if (!cancelled) setTarget("/onboarding");
          return;
        }

        if (response.ok) {
          const json = await response.json();
          const merged = { ...(user || {}), ...(json?.user || {}) };
          await AsyncStorage.setItem("user", JSON.stringify(merged));

          if (merged.status === "LIFETIME_INELIGIBLE") {
            if (!cancelled)
              setTarget("/screening/outcome?result=LIFETIME_INELIGIBLE");
            return;
          }

          if (isActiveCooldown(merged.status, merged.cooldownUntil)) {
            if (!cancelled) setTarget("/screening/cooldown");
            return;
          }

          if (merged.status === "APPROVED") {
            // NEW: after passing the quiz, users must finish post-quiz profile onboarding.
            try {
              const profileResp = await fetch(
                `/api/profile/me?userId=${Number(merged.id)}`,
              );
              if (profileResp.ok) {
                const profileJson = await profileResp.json();
                const profile = profileJson?.profile || null;

                if (!isPostQuizOnboardingComplete(profile)) {
                  if (!cancelled) setTarget("/onboarding/profile");
                  return;
                }
              }
            } catch (e) {
              console.error(e);
              // If the profile check fails, we still allow the user into the app.
              // (We also gate from the Outcome screen.)
            }

            // IMPORTANT: don’t navigate using route-group segments like /(tabs).
            // The actual URL for the home tab is just /home, and that will mount the (tabs) layout.
            if (!cancelled) setTarget("/home");
            return;
          }

          // Default: not approved yet (or cooldown expired)
          if (!cancelled) setTarget("/screening/gate");
          return;
        }

        // If the server lookup fails (non-404), fall back to local status.
        if (user.status === "LIFETIME_INELIGIBLE") {
          if (!cancelled)
            setTarget("/screening/outcome?result=LIFETIME_INELIGIBLE");
        } else if (isActiveCooldown(user.status, user.cooldownUntil)) {
          if (!cancelled) setTarget("/screening/cooldown");
        } else if (user.status === "APPROVED") {
          // IMPORTANT: don’t navigate using route-group segments like /(tabs).
          if (!cancelled) setTarget("/home");
        } else {
          if (!cancelled) setTarget("/screening/gate");
        }
      } catch (e) {
        console.error(e);
        // Fall back to onboarding so the app always starts with a clear entry point.
        if (!cancelled) setTarget("/onboarding");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={target} />;
}
