import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";

export function PrimaryPhotoStep({
  primaryPhotoUrl,
  handlePickPrimaryPhoto,
  busy,
  labelStyle,
}) {
  const chooseLabel = primaryPhotoUrl ? "Change photo" : "Choose photo";

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={labelStyle}>Add your profile picture (required)</Text>

      <View
        style={{
          marginTop: 6,
          width: 160,
          height: 160,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.10)",
          backgroundColor: "rgba(17,17,17,0.03)",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {primaryPhotoUrl ? (
          <Image
            source={{ uri: primaryPhotoUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Text style={{ color: "#6B7280", fontWeight: "800" }}>No photo</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={handlePickPrimaryPhoto}
        disabled={busy}
        activeOpacity={0.9}
        style={{
          marginTop: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.10)",
          backgroundColor: "rgba(17,17,17,0.03)",
          paddingVertical: 14,
          paddingHorizontal: 16,
          width: "100%",
          alignItems: "center",
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#111", fontWeight: "900" }}>{chooseLabel}</Text>
      </TouchableOpacity>

      <Text
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "#6B7280",
          textAlign: "center",
          lineHeight: 16,
        }}
      >
        Tip: Use a clear solo picture.
      </Text>
    </View>
  );
}
