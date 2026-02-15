import { View, Text, TouchableOpacity } from "react-native";

export function StepGender({ gender, setGender, isBusy }) {
  return (
    <>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#111",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Select your gender
      </Text>

      <View style={{ gap: 12 }}>
        {["Female", "Male"].map((g) => {
          const selected = gender === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              disabled={isBusy}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderWidth: 1,
                borderColor: selected
                  ? "rgba(124,58,237,0.55)"
                  : "rgba(17,17,17,0.10)",
                backgroundColor: selected
                  ? "rgba(124,58,237,0.10)"
                  : "rgba(17,17,17,0.03)",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "900",
                  color: "#111",
                }}
              >
                {g}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text
        style={{
          marginTop: 14,
          textAlign: "center",
          fontSize: 12,
          color: "#6B7280",
        }}
      >
        We use this to serve the correct screening.
      </Text>
    </>
  );
}
