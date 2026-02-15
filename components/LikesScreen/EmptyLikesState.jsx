import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const CTA_GRADIENT = ["#FF4FD8", "#7C3AED"];

export function EmptyLikesState({
  insets,
  illustrationUri,
  onUpgrade,
  refreshControl,
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={refreshControl}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 18,
        paddingBottom: insets.bottom + 26,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 420,
          alignSelf: "center",
          backgroundColor: "rgba(255,255,255,0.92)",
          borderRadius: 28,
          padding: 22,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.12,
          shadowRadius: 26,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Image
            source={{ uri: illustrationUri }}
            style={{ width: 240, height: 240, borderRadius: 20 }}
            contentFit="contain"
            transition={150}
          />

          <Text
            style={{
              marginTop: 16,
              fontSize: 20,
              fontWeight: "900",
              color: "#111",
              textAlign: "center",
            }}
          >
            No likes yet
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            When someone likes you, they'll show up here.
          </Text>

          <TouchableOpacity
            onPress={onUpgrade}
            activeOpacity={0.9}
            style={{
              marginTop: 18,
              width: "100%",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 15,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.18,
                shadowRadius: 18,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Become Committed
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#9CA3AF",
              textAlign: "center",
            }}
          >
            Pull down to refresh
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
