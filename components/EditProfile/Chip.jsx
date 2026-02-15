import { View, Text, TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";

export function Chip({ text, onRemove }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#F5F5F5",
        borderWidth: 1,
        borderColor: "#E5E5EA",
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 13, color: "#111" }}>{text}</Text>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} style={{ padding: 2 }}>
          <X size={14} color="#6B7280" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
