import { Text } from "react-native";
import { Card } from "../Card";
import { THEME } from "../theme";

export function PromptSection({ prompt }) {
  const q = prompt?.question || "Prompt";
  const a = typeof prompt?.answer === "string" ? prompt.answer : "";
  const hasAnswer = a.trim().length > 0;

  if (!hasAnswer) {
    return null;
  }

  return (
    <Card style={{ padding: 16 }}>
      <Text
        style={{
          color: THEME.muted,
          fontWeight: "900",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {q}
      </Text>
      <Text
        style={{
          color: THEME.text,
          fontSize: 18,
          marginTop: 10,
          fontWeight: "900",
          lineHeight: 24,
        }}
      >
        {a}
      </Text>
    </Card>
  );
}
