import { View } from "react-native";
import { THEME } from "./theme";

export function Card({ children, style }) {
  return (
    <View
      style={{
        backgroundColor: THEME.cardBg,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 22,
        elevation: 4,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
