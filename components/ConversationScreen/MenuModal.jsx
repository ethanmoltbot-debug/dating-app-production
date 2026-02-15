import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";

export function MenuModal({
  menuOpen,
  setMenuOpen,
  setReportOpen,
  weMet,
  onPressUnmatch,
  blockUser,
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
            paddingBottom: insets.bottom + 12,
            paddingTop: 10,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              setReportOpen(true);
            }}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
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
              weMet?.();
            }}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
          >
            <Text style={{ fontSize: 16, color: "#2D2D2D", fontWeight: "600" }}>
              We met
            </Text>
            <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
              Log that you met in person.
            </Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              onPressUnmatch?.();
            }}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
          >
            <Text style={{ fontSize: 16, color: "#B00020", fontWeight: "600" }}>
              Unmatch
            </Text>
            <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
              Removes the match and deletes the chat.
            </Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              blockUser();
            }}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
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
