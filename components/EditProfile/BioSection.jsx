import { TextInput } from "react-native";
import { Section } from "./Section";

export function BioSection({ bio, onChangeText }) {
  return (
    <Section title="Bio" subtitle="Keep it short, honest, and specific.">
      <TextInput
        value={bio}
        onChangeText={onChangeText}
        placeholder="What are you like on a good day?"
        placeholderTextColor="#9CA3AF"
        multiline
        style={{
          minHeight: 110,
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#E5E5EA",
          borderRadius: 16,
          padding: 14,
          fontSize: 15,
          color: "#111",
          textAlignVertical: "top",
        }}
      />
    </Section>
  );
}
