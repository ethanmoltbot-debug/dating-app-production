import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";

export function RegisterHeader({ onBack, isBusy }) {
  return (
    <View
      style={{
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        disabled={isBusy}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.86)",
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
          alignItems: "center",
          justifyContent: "center",
          opacity: isBusy ? 0.6 : 1,
        }}
      >
        <ArrowLeft size={20} color="#111" />
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#111",
          letterSpacing: 1,
        }}
      >
        Wifey
      </Text>

      <View style={{ width: 44, height: 44 }} />
    </View>
  );
}
