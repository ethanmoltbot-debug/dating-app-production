import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";
import { SecondaryButton } from "./SecondaryButton";

export function ActionsModal({
  visible,
  onClose,
  onChangeDetails,
  onCancelDate,
  busy,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E5E5E5",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
            Date options
          </Text>

          <View style={{ marginTop: 12, gap: 10 }}>
            <SecondaryButton
              label="Change details"
              disabled={busy}
              onPress={onChangeDetails}
            />

            <TouchableOpacity
              onPress={onCancelDate}
              disabled={busy}
              style={{
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#FECACA",
                backgroundColor: "#FEF2F2",
                alignItems: "center",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <Text
                style={{ fontSize: 15, fontWeight: "900", color: "#B91C1C" }}
              >
                Cancel date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                backgroundColor: "#fff",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#111" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 10 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
