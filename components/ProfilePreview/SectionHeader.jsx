import { View, Text } from "react-native";
import { THEME } from "./theme";

export function SectionHeader({ title, subtitle }) {
  const showSubtitle = typeof subtitle === "string" && subtitle.length > 0;

  return (
    <View>
      <Text style={{ fontSize: 16, fontWeight: "800", color: THEME.text }}>
        {title}
      </Text>
      {showSubtitle ? (
        <Text style={{ marginTop: 6, color: THEME.muted, fontWeight: "600" }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
