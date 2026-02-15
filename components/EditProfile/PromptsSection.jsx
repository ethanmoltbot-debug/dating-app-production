import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Section } from "./Section";

export function PromptsSection({ prompts, onOpenPicker, onChangeAnswer }) {
  return (
    <Section
      title="Prompts"
      subtitle="Answer 3 prompts so people can start a real convo."
    >
      {[0, 1, 2].map((idx) => {
        const prompt = prompts[idx] || { question: "", answer: "" };
        const q = prompt.question || "Pick a prompt";

        return (
          <View
            key={idx}
            style={{
              backgroundColor: "#fff",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#E5E5EA",
              padding: 14,
              marginBottom: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => onOpenPicker(idx)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: "#9CA3AF" }}>
                  Prompt {idx + 1}
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#111",
                  }}
                >
                  {q}
                </Text>
              </View>
              <ChevronRight size={18} color="#C7C7CC" />
            </TouchableOpacity>

            <TextInput
              value={prompt.answer}
              onChangeText={(t) => onChangeAnswer(idx, t)}
              placeholder="Your answer"
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                marginTop: 12,
                minHeight: 64,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#F0F0F0",
                padding: 12,
                fontSize: 15,
                color: "#111",
                textAlignVertical: "top",
                backgroundColor: "#FAFAFA",
              }}
            />
          </View>
        );
      })}
    </Section>
  );
}
