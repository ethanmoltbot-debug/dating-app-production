import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Card } from "./Card";
import { Pill } from "./Pill";

const ACCENT = "#FF1744";

export function PreferencesCard({
  moods,
  moodOptions,
  onToggleMood,
  onSave,
  isSaving,
  busy,
}) {
  return (
    <Card>
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
        What are you two in the mood for?
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 12,
        }}
      >
        {moodOptions.map((label) => {
          const active = moods.includes(label);
          return (
            <Pill
              key={label}
              label={label}
              active={active}
              onPress={() => onToggleMood(label)}
            />
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onSave}
        disabled={busy}
        style={{
          marginTop: 14,
          alignSelf: "flex-start",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "#E5E5E5",
          backgroundColor: "#fff",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={ACCENT} />
        ) : (
          <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
            Save vibe
          </Text>
        )}
      </TouchableOpacity>
    </Card>
  );
}
