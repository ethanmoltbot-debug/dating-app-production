import { View, Text, TouchableOpacity } from "react-native";
import { ChevronDown } from "lucide-react-native";

export function StepBirthday({ birthdateLabel, onOpenPicker, isBusy }) {
  return (
    <>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#111",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        What&apos;s your birthday?
      </Text>

      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.10)",
          backgroundColor: "rgba(255,255,255,0.70)",
          overflow: "hidden",
        }}
      >
        <TouchableOpacity
          onPress={onOpenPicker}
          disabled={isBusy}
          activeOpacity={0.9}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 16,
            opacity: isBusy ? 0.6 : 1,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "800",
                marginBottom: 6,
              }}
            >
              Birthday
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: "#111",
              }}
            >
              {birthdateLabel || "Select"}
            </Text>
          </View>

          <ChevronDown size={18} color="#111" />
        </TouchableOpacity>
      </View>

      <Text
        style={{
          marginTop: 10,
          textAlign: "center",
          fontSize: 13,
          color: "#6B7280",
          fontWeight: "700",
        }}
      >
        You must be 18+
      </Text>
    </>
  );
}
