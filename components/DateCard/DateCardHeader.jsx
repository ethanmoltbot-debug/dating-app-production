import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { ChevronRight } from "lucide-react-native";

export function DateCardHeader({
  coverThumb,
  title,
  showWaitingPill,
  showLoading,
  showError,
  buttonLabel,
  onPress,
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      {coverThumb ? (
        <Image
          source={{ uri: coverThumb }}
          style={{ width: 38, height: 38, borderRadius: 10 }}
          contentFit="cover"
          transition={150}
        />
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "800",
              color: "#2D2D2D",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>

          {showWaitingPill ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "#FFF1F3",
                borderWidth: 1,
                borderColor: "#FFD0D8",
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "800", color: "#B00020" }}
              >
                Waiting on them
              </Text>
            </View>
          ) : null}
        </View>

        {showLoading ? (
          <Text style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
            Loading…
          </Text>
        ) : null}

        {showError ? (
          <Text style={{ fontSize: 11, color: "#B00020", marginTop: 2 }}>
            Could not load date
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onPress}
        disabled={showLoading}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 9,
          borderRadius: 999,
          backgroundColor: "#FF1744",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          opacity: showLoading ? 0.7 : 1,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "900", color: "#fff" }}>
          {buttonLabel}
        </Text>
        <ChevronRight size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
