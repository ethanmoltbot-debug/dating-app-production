import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export function RegisterActions({
  onContinue,
  onSignIn,
  isBusy,
  busyLabel,
  primaryLabel,
  insets,
  ctaGradient,
  secondaryHidden,
  // NEW: legal copy under the button
  legalHidden,
  privacyHref,
  termsHref,
}) {
  const router = useRouter();
  const effectiveBusyLabel = busyLabel || "Loading…";

  const showSecondary = !secondaryHidden && typeof onSignIn === "function";

  const effectivePrivacyHref = privacyHref || "/profile/privacy";
  const effectiveTermsHref = termsHref || "/profile/terms";

  const openHref = (href) => {
    const value = String(href || "").trim();
    if (!value) return;

    // Internal routes
    if (value.startsWith("/")) {
      router.push(value);
      return;
    }

    // External URLs
    Linking.openURL(value);
  };

  return (
    <View style={{ padding: 24, paddingBottom: insets.bottom + 24 }}>
      <TouchableOpacity
        onPress={onContinue}
        disabled={isBusy}
        activeOpacity={0.9}
        style={{
          width: "100%",
          maxWidth: 340,
          alignSelf: "center",
          borderRadius: 16,
          overflow: "hidden",
          opacity: isBusy ? 0.7 : 1,
        }}
      >
        <LinearGradient
          colors={ctaGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 18, alignItems: "center" }}
        >
          {isBusy ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <ActivityIndicator size="small" color="#fff" />
              <Text style={{ fontSize: 17, fontWeight: "900", color: "#fff" }}>
                {effectiveBusyLabel}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 17, fontWeight: "900", color: "#fff" }}>
              {primaryLabel}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {!legalHidden ? (
        <Text
          style={{
            marginTop: 12,
            maxWidth: 340,
            alignSelf: "center",
            textAlign: "center",
            fontSize: 12,
            lineHeight: 16,
            color: "#6B7280",
          }}
        >
          By continuing, you agree to our{" "}
          <Text
            onPress={() => {
              if (isBusy) return;
              openHref(effectivePrivacyHref);
            }}
            style={{ color: "#7C3AED", fontWeight: "900" }}
          >
            Privacy Policy
          </Text>{" "}
          and{" "}
          <Text
            onPress={() => {
              if (isBusy) return;
              openHref(effectiveTermsHref);
            }}
            style={{ color: "#7C3AED", fontWeight: "900" }}
          >
            Terms & Conditions
          </Text>
          .
        </Text>
      ) : null}

      {showSecondary ? (
        <>
          <View style={{ height: 16 }} />

          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
          >
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={onSignIn} disabled={isBusy}>
              <Text
                style={{ fontSize: 14, color: "#7C3AED", fontWeight: "900" }}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
}
