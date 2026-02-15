import { View, TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";

export function SubscriptionHeader({ onClose }) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.8}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={24} color="#111" />
      </TouchableOpacity>

      <View style={{ width: 40 }} />

      <View style={{ width: 40 }} />
    </View>
  );
}
