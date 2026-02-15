import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function OnboardingFooter({
  step,
  totalSteps,
  validateAndNext,
  busy,
  saveMutationPending,
  uploadLoading,
  insets,
  CTA_GRADIENT,
  onSkip,
  allowSkip,
}) {
  // allowSkip is now controlled by the parent so we can enforce “only height + profile photo are required”
  const primaryLabel = step === totalSteps - 1 ? "Finish" : "Continue";

  const handleSkip = () => {
    if (!allowSkip) return;
    if (busy) return;
    if (typeof onSkip === "function") {
      onSkip();
    }
  };

  return (
    <View style={{ padding: 24, paddingBottom: insets.bottom + 24 }}>
      <TouchableOpacity
        onPress={validateAndNext}
        disabled={busy}
        activeOpacity={0.9}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          opacity: busy ? 0.6 : 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 16,
        }}
      >
        <LinearGradient
          colors={CTA_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18, alignItems: "center" }}
        >
          {saveMutationPending || uploadLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>
              {primaryLabel}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {allowSkip ? (
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.85}
          style={{ paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#6B7280", fontWeight: "900" }}>Skip</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
