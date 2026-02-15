import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";

export default function ReportMessageModal({
  open,
  onClose,
  messagePreview,
  reportType,
  setReportType,
  reportDesc,
  setReportDesc,
  sending,
  onSubmit,
  insets,
}) {
  const safePreview =
    typeof messagePreview === "string" && messagePreview.trim().length > 0
      ? messagePreview.trim()
      : null;

  return (
    <Modal
      visible={Boolean(open)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <Pressable
          onPress={Keyboard.dismiss}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingTop: 14,
              paddingHorizontal: 16,
              paddingBottom: (insets?.bottom || 0) + 16,
              maxHeight: "85%",
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#2D2D2D",
                    flex: 1,
                  }}
                >
                  Report message
                </Text>

                <TouchableOpacity
                  onPress={Keyboard.dismiss}
                  style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                  accessibilityLabel="Dismiss keyboard"
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#2D2D2D",
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                Choose a reason and add a short note. We’ll review it.
              </Text>

              {safePreview ? (
                <View
                  style={{
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: "#EFEFEF",
                    backgroundColor: "#FAFAFA",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{ fontSize: 12, fontWeight: "800", color: "#444" }}
                  >
                    Message
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#111",
                      marginTop: 6,
                      lineHeight: 18,
                    }}
                  >
                    {safePreview}
                  </Text>
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {[
                  "HARASSMENT",
                  "INAPPROPRIATE_CONTENT",
                  "SPAM",
                  "FRAUD",
                  "OTHER",
                ].map((t) => {
                  const active = reportType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setReportType(t)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? "#FF1744" : "#E5E5E5",
                        backgroundColor: active ? "#FFEEF1" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: active ? "#B00020" : "#2D2D2D",
                          fontWeight: active ? "700" : "600",
                        }}
                      >
                        {t.replace(/_/g, " ")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                value={reportDesc}
                onChangeText={setReportDesc}
                placeholder="What happened? (required)"
                placeholderTextColor="#999"
                style={{
                  marginTop: 12,
                  minHeight: 110,
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: "#2D2D2D",
                  backgroundColor: "#fff",
                  textAlignVertical: "top",
                }}
                multiline
                maxLength={5000}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={() => Keyboard.dismiss()}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={Boolean(sending)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E5E5E5",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#2D2D2D",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onSubmit}
                  disabled={Boolean(sending)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "#FF1744",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: sending ? 0.7 : 1,
                  }}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#fff",
                      }}
                    >
                      Send report
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
