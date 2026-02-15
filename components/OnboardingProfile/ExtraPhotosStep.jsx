import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";

export function ExtraPhotosStep({
  extraPhotoUrls,
  handleAddExtraPhoto,
  removeExtraPhoto,
  busy,
  labelStyle,
}) {
  const canAddMore = extraPhotoUrls.length < 5;
  const addLabel = canAddMore ? "Add photo" : "Max photos added";

  return (
    <View>
      <Text style={labelStyle}>Add more photos (optional)</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {extraPhotoUrls.map((url) => (
          <View key={url} style={{ width: 92 }}>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 18,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.10)",
                backgroundColor: "rgba(17,17,17,0.03)",
              }}
            >
              <Image
                source={{ uri: url }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={150}
              />
            </View>
            <TouchableOpacity
              onPress={() => removeExtraPhoto(url)}
              style={{ paddingVertical: 8, alignItems: "center" }}
            >
              <Text style={{ color: "#6B7280", fontWeight: "800" }}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={{ height: 10 }} />

      <TouchableOpacity
        onPress={handleAddExtraPhoto}
        disabled={busy || !canAddMore}
        activeOpacity={0.9}
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.10)",
          backgroundColor: "rgba(17,17,17,0.03)",
          paddingVertical: 14,
          alignItems: "center",
          opacity: busy || !canAddMore ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#111", fontWeight: "900" }}>{addLabel}</Text>
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
        You can always add more later in Edit Profile.
      </Text>
    </View>
  );
}
