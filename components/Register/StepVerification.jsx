import { View, Text, TouchableOpacity } from "react-native";
import { Camera } from "lucide-react-native";
import { Image } from "expo-image";

export function StepVerification({ selectedImage, onPickPhoto, isBusy }) {
  const previewUri = selectedImage?.previewUri || selectedImage?.uri || null;

  return (
    <>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#111",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Photo verification
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#6B7280",
          textAlign: "center",
          lineHeight: 18,
          marginBottom: 14,
          fontWeight: "700",
        }}
      >
        Take a quick selfie so we can verify your profile before you start the
        screening.
      </Text>

      {previewUri ? (
        <View style={{ alignItems: "center" }}>
          <Image
            source={{ uri: previewUri }}
            style={{ width: 140, height: 140, borderRadius: 18 }}
            contentFit="cover"
            // We generate a centered square preview in the register flow, so keep the display simple here.
            contentPosition="center"
            transition={150}
          />
          <TouchableOpacity
            onPress={onPickPhoto}
            disabled={isBusy}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: "#7C3AED", fontWeight: "900" }}>
              Retake photo
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onPickPhoto}
          disabled={isBusy}
          activeOpacity={0.9}
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.10)",
            backgroundColor: "rgba(17,17,17,0.03)",
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Camera size={18} color="#111" />
          <Text style={{ color: "#111", fontWeight: "900" }}>Take selfie</Text>
        </TouchableOpacity>
      )}
    </>
  );
}
