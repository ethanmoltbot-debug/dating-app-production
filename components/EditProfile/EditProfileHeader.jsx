import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";

const ACCENT = "#7C3AED";

export function EditProfileHeader({
  topInset,
  busy,
  saving,
  onClose,
  onSave,
  activeTab,
  onChangeTab,
}) {
  const isEdit = activeTab !== "view";

  return (
    <View
      style={{
        paddingTop: topInset + 10,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
      }}
    >
      {/* Top row */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={22} color="#111" />
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>
          Profile
        </Text>

        <TouchableOpacity
          disabled={busy}
          onPress={onSave}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: busy ? "#C4B5FD" : ACCENT,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {isEdit ? "Done" : "Done"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit / View segmented control */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <View
          style={{
            backgroundColor: "#F2F2F7",
            borderRadius: 12,
            padding: 2,
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            onPress={() => onChangeTab?.("edit")}
            activeOpacity={0.9}
            style={{
              flex: 1,
              borderRadius: 10,
              paddingVertical: 8,
              alignItems: "center",
              backgroundColor: isEdit ? "#fff" : "transparent",
            }}
          >
            <Text style={{ color: "#111", fontWeight: "700" }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onChangeTab?.("view")}
            activeOpacity={0.9}
            style={{
              flex: 1,
              borderRadius: 10,
              paddingVertical: 8,
              alignItems: "center",
              backgroundColor: !isEdit ? "#fff" : "transparent",
            }}
          >
            <Text style={{ color: "#111", fontWeight: "700" }}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
