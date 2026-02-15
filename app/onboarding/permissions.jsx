import { Redirect } from "expo-router";

export default function OnboardingPermissions() {
  // Backwards-compatible route: older parts of the app may still link here.
  return <Redirect href="/onboarding/notifications" />;
}
