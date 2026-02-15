import { View, Text, TouchableOpacity } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

export function HiddenSectionHeader({ hiddenCount, hiddenExpanded, onToggle }) {
  const hiddenTitle = hiddenCount > 0 ? `Hidden (${hiddenCount})` : "Hidden";

  return (
    <TouchableOpacity
      onPress={() => {
        if (hiddenCount <= 0) {
          return;
        }
        onToggle();
      }}
      activeOpacity={hiddenCount > 0 ? 0.85 : 1}
      style={{
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "900",
          color: "#111",
          paddingHorizontal: 4,
        }}
      >
        {hiddenTitle}
      </Text>

      {hiddenCount > 0 ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(17,17,17,0.05)",
          }}
        >
          {hiddenExpanded ? (
            <ChevronUp size={18} color="#111" />
          ) : (
            <ChevronDown size={18} color="#111" />
          )}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
