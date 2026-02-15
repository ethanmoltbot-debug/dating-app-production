import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function QuestionCard({
  question,
  selectedAnswerIds,
  onToggleAnswer,
  submitting,
  accent,
  questionFadeAnim,
  questionSlideAnim,
}) {
  const insets = useSafeAreaInsets();

  const allowMultiple = !!question?.allowMultiple;

  const minSelectionsRequiredRaw = allowMultiple
    ? Number(question?.minSelectionsRequired)
    : null;
  const minSelectionsRequired =
    allowMultiple &&
    Number.isFinite(minSelectionsRequiredRaw) &&
    minSelectionsRequiredRaw > 0
      ? minSelectionsRequiredRaw
      : null;

  const selectionHintText = allowMultiple
    ? minSelectionsRequired && minSelectionsRequired > 1
      ? `Select at least ${minSelectionsRequired}`
      : "Select all that apply"
    : null;

  return (
    <Animated.View
      style={{
        flex: 1,
        padding: 16,
        paddingTop: 18,
        opacity: questionFadeAnim,
        transform: [{ translateY: questionSlideAnim }],
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.92)",
            borderRadius: 20,
            padding: 22,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.06,
            shadowRadius: 18,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: "#111",
              marginBottom: 10,
              lineHeight: 30,
            }}
          >
            {question?.text}
          </Text>

          {!!selectionHintText ? (
            <Text
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginBottom: 18,
                fontWeight: "700",
              }}
            >
              {selectionHintText}
            </Text>
          ) : null}

          <View style={{ gap: 12 }}>
            {question?.answers.map((answer) => {
              const answerId = String(answer.id);
              const isSelected = selectedAnswerIds.includes(answerId);

              return (
                <TouchableOpacity
                  key={answer.id}
                  onPress={() => onToggleAnswer(answer.id)}
                  disabled={submitting}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isSelected
                      ? "rgba(124,58,237,0.10)"
                      : "#fff",
                    borderRadius: 14,
                    padding: 18,
                    borderWidth: 2,
                    borderColor: isSelected
                      ? "rgba(124,58,237,0.45)"
                      : "rgba(17,17,17,0.08)",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: allowMultiple ? 6 : 12,
                      borderWidth: 2,
                      borderColor: isSelected ? accent : "#B0B0B0",
                      backgroundColor: isSelected ? accent : "transparent",
                      marginRight: 14,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected ? (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: allowMultiple ? 2 : 5,
                          backgroundColor: "#fff",
                        }}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#111",
                      lineHeight: 22,
                      flex: 1,
                      fontWeight: isSelected ? "800" : "600",
                    }}
                  >
                    {answer.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
