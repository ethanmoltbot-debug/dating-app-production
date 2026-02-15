import { View, Text } from "react-native";

export function QuizHeader({
  progress,
  accent,
  // remove debug props; keep API stable if something still passes them
  // audienceGenderUsed,
  // debugUserId,
  // debugQuestionId,
}) {
  const progressPercent =
    progress.totalSteps > 0 ? (progress.step / progress.totalSteps) * 100 : 0;

  // Debug line removed (it was leaking dev info like audience=MALE)

  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.84)",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "rgba(17,17,17,0.06)",
      }}
    >
      <Text
        style={{
          fontSize: 18,
          color: "#111",
          marginBottom: 10,
          fontWeight: "900",
          textAlign: "center",
          letterSpacing: 0.6,
        }}
      >
        Wifey Screening
      </Text>

      {/* debug line intentionally removed */}

      <View
        style={{
          height: 6,
          backgroundColor: "rgba(17,17,17,0.08)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: accent,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}
