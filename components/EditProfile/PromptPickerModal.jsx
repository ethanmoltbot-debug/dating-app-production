import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { X } from "lucide-react-native";

const PROMPT_QUESTIONS = [
  "The way to win me over is…",
  "A green flag I look for…",
  "A non-negotiable for me is…",
  "My ideal Sunday is…",
  "Two truths and a lie…",
  "The last time I laughed hard was…",
  "Unusual skill…",
  "I'm looking for…",
  "Let's make sure we…",
  "I get along best with people who…",
];

export function PromptPickerModal({
  visible,
  onClose,
  onSelectQuestion,
  bottomInset,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
      />

      <View
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          paddingBottom: bottomInset + 14,
          paddingTop: 10,
          paddingHorizontal: 16,
          maxHeight: "70%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>
            Choose a prompt
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#111" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {PROMPT_QUESTIONS.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => onSelectQuestion(q)}
              style={{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#F0F0F0",
              }}
            >
              <Text style={{ color: "#111", fontSize: 15 }}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
