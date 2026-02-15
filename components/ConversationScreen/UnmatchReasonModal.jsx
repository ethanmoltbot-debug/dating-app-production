import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";

const REASONS = [
  { code: "NOT_INTERESTED", label: "Not interested" },
  { code: "NOT_READY_TO_MEET", label: "Not ready to meet" },
  { code: "NO_LONGER_LOOKING", label: "No longer looking" },
  { code: "UNCOMFORTABLE", label: "Uncomfortable" },
  { code: "SAFETY_CONCERN", label: "Safety concern" },
  { code: "OTHER", label: "Other" },
];

export function UnmatchReasonModal({
  visible,
  onClose,
  onPickReason,
  insets,
  otherName,
}) {
  const name =
    typeof otherName === "string" && otherName.trim() ? otherName : "them";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#fff",
            paddingBottom: (insets?.bottom || 0) + 12,
            paddingTop: 14,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111" }}>
              Why are you unmatching?
            </Text>
            <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
              This helps us keep the community safe and improve matches.
            </Text>
            <Text style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
              Unmatching will remove {name} and delete this chat.
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

          {REASONS.map((r, idx) => {
            return (
              <View key={r.code}>
                <TouchableOpacity
                  onPress={() => onPickReason?.(r.code)}
                  style={{ paddingHorizontal: 18, paddingVertical: 14 }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#2D2D2D",
                      fontWeight: "600",
                    }}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
                {idx < REASONS.length - 1 ? (
                  <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />
                ) : null}
              </View>
            );
          })}

          <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

          <TouchableOpacity
            onPress={onClose}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
          >
            <Text style={{ fontSize: 16, color: "#2D2D2D", fontWeight: "600" }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
