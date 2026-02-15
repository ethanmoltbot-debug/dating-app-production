import { View, Text, TouchableOpacity } from "react-native";
import { MoreHorizontal } from "lucide-react-native";
import { THEME } from "./theme";

export function MediaTopBar({ leftText, onPressMenu }) {
  const showLeftText = typeof leftText === "string" && leftText.length > 0;
  const showMenu = typeof onPressMenu === "function";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 14,
        left: 14,
        right: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {showLeftText ? (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: THEME.chipBg,
            borderWidth: 1,
            borderColor: THEME.chipBorder,
          }}
        >
          <Text style={{ color: THEME.text, fontWeight: "900", fontSize: 12 }}>
            {leftText}
          </Text>
        </View>
      ) : (
        <View />
      )}

      {showMenu ? (
        <TouchableOpacity
          onPress={onPressMenu}
          activeOpacity={0.85}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: THEME.chipBg,
            borderWidth: 1,
            borderColor: THEME.chipBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="Profile options"
        >
          <MoreHorizontal size={18} color={THEME.text} />
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
}
