import { TextInput } from "react-native";
import { Section } from "./Section";

export function NameSection({ displayName, onChangeText }) {
  return (
    <Section title="Name" subtitle="This is what other people will see.">
      <TextInput
        value={displayName}
        onChangeText={onChangeText}
        placeholder="Your name"
        placeholderTextColor="#9CA3AF"
        style={{
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#E5E5EA",
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: "#111",
        }}
      />
    </Section>
  );
}
