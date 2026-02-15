import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_INITIAL_KEY = "interest_picker_initial";

export function AboutStep({ about, setAbout, labelStyle, inputStyle }) {
  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={labelStyle}>About (optional)</Text>
        <TextInput
          value={about}
          onChangeText={setAbout}
          placeholder="A few lines about you…"
          placeholderTextColor="#6B7280"
          style={{
            ...inputStyle,
            minHeight: 140,
            textAlignVertical: "top",
          }}
          multiline
          returnKeyType={Platform.OS === "ios" ? "default" : "done"}
        />
      </View>

      <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "800" }}>
        You can always update this later.
      </Text>
    </View>
  );
}

export function InterestsStep({ interests, labelStyle }) {
  const router = useRouter();

  const safeInterests = useMemo(
    () =>
      (Array.isArray(interests) ? interests : []).filter(
        (x) => typeof x === "string",
      ),
    [interests],
  );

  const selectedLabel = `${safeInterests.length}/12 selected`;

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
    <View style={{ gap: 14 }}>
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View>
            <Text style={labelStyle}>Interests (optional)</Text>
            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "800" }}>
              {selectedLabel}
            </Text>
          </View>

          <TouchableOpacity
            onPress={openPicker}
            activeOpacity={0.9}
            style={{
              backgroundColor: "#7C3AED",
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
            <Text style={{ color: "#6B7280", fontWeight: "800" }}>
              Tap “Choose” to pick a few interests.
            </Text>
          ) : null}

          {safeInterests.map((label) => (
            <View
              key={`onboarding-interest-${label}`}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.10)",
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
            >
              <Text style={{ color: "#111", fontWeight: "800" }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "800" }}>
        You can skip this and add interests later.
      </Text>
    </View>
  );
}

// Backwards compatible export (older code may still import this)
export function AboutInterestsStep(props) {
  return (
    <View style={{ gap: 16 }}>
      <AboutStep
        about={props.about}
        setAbout={props.setAbout}
        labelStyle={props.labelStyle}
        inputStyle={props.inputStyle}
      />
      <InterestsStep
        interests={props.interests}
        labelStyle={props.labelStyle}
      />
    </View>
  );
}
