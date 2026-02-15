import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";

export default function ProfileMenuModal({
  menuOpen,
  setMenuOpen,
  onPressReport,
  onPressBlock,
  insets,
}) {
  return (
    <Modal
      visible={menuOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuOpen(false)}
    >
      <Pressable
        onPress={() => setMenuOpen(false)}
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
            paddingTop: 10,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              onPressReport?.();
            }}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Report this user"
          >
            <Text style={{ fontSize: 16, color: "#2D2D2D", fontWeight: "600" }}>
              Report
            </Text>
            <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
              Tell us what happened.
            </Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              onPressBlock?.();
            }}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Block this user"
          >
            <Text style={{ fontSize: 16, color: "#B00020", fontWeight: "600" }}>
              Block
            </Text>
            <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
              Blocks them from matching or messaging you.
            </Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

          <TouchableOpacity
            onPress={() => setMenuOpen(false)}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
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
