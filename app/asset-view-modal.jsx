import { useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { X } from "lucide-react-native";

function pickFirst(v) {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default function AssetViewModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const url = useMemo(() => {
    const raw = pickFirst(params?.url);
    const s = String(raw || "").trim();
    return s ? s : null;
  }, [params?.url]);

  const title = useMemo(() => {
    const raw = pickFirst(params?.title);
    const s = String(raw || "").trim();
    return s ? s : null;
  }, [params?.title]);

  const onClose = useCallback(() => {
    try {
      router.back();
    } catch (e) {
      console.error(e);
      router.replace("/home");
    }
  }, [router]);

  const topPad = Math.max(insets.top, 14);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "fade",
        }}
      />

      <View
        style={{
          paddingTop: topPad,
          paddingHorizontal: 14,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          {title ? (
            <Text
              numberOfLines={1}
              style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}
            >
              {title}
            </Text>
          ) : (
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              Preview
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.85}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.18)",
          }}
        >
          <X size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {!url ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
            Nothing to preview
          </Text>
          <Text
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            This screen needs a url.
          </Text>

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 16,
              backgroundColor: "#fff",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#000", fontWeight: "900" }}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri: url }}
            style={{ flex: 1 }}
            contentFit="contain"
            transition={150}
            placeholder={null}
          />

          {/* NOTE: no spinner overlay here — expo-image handles its own loading nicely */}
        </View>
      )}

      <View style={{ height: Math.max(insets.bottom, 12) }} />
    </View>
  );
}
