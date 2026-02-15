import { View, Text, TouchableOpacity } from "react-native";
import { useCallback } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Section } from "./Section";
import { Chip } from "./Chip";

const ACCENT = "#7C3AED";

const STORAGE_INITIAL_KEY = "interest_picker_initial";

export function InterestsSection({ interests, onRemoveInterest }) {
  const router = useRouter();

  const safeInterests = Array.isArray(interests) ? interests : [];
  const countLabel = `${safeInterests.length}/12 selected`;

  const openPicker = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_INITIAL_KEY,
        JSON.stringify(safeInterests),
      );
    } catch (e) {
      console.error(e);
    }
    router.push("/interests");
  }, [router, safeInterests]);

  return (
    <Section title="Interests" subtitle="Pick a few things you actually enjoy.">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Text style={{ color: "#6B7280", fontWeight: "800" }}>
          {countLabel}
        </Text>

        <TouchableOpacity
          onPress={openPicker}
          activeOpacity={0.9}
          style={{
            backgroundColor: ACCENT,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Choose</Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 12,
        }}
      >
        {safeInterests.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>
            Tap “Choose” to pick interests.
          </Text>
        ) : null}

        {safeInterests.map((it, idx) => (
          <Chip
            key={`${it}-${idx}`}
            text={String(it)}
            onRemove={
              onRemoveInterest ? () => onRemoveInterest(idx) : undefined
            }
          />
        ))}
      </View>
    </Section>
  );
}
