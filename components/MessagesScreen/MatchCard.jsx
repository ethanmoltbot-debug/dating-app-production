import { View, Text, TouchableOpacity, Image } from "react-native";
import { getFirstPhotoUrl } from "@/utils/messagesScreenHelpers";

export function MatchCard({ match, onPress }) {
  const photoUrl =
    getFirstPhotoUrl(match?.photos) || "https://via.placeholder.com/160";

  const name =
    typeof match?.display_name === "string" ? match.display_name : "";

  return (
    <TouchableOpacity
      onPress={() => onPress(match)}
      activeOpacity={0.9}
      style={{ marginRight: 12 }}
    >
      <View
        style={{
          width: 110,
          backgroundColor: "rgba(255,255,255,0.86)",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.06)",
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
        }}
      >
        <Image
          source={{ uri: photoUrl }}
          style={{ width: 110, height: 140 }}
          resizeMode="cover"
        />

        <View style={{ padding: 10 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: "900",
              color: "#111",
            }}
          >
            {name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              fontSize: 11,
              fontWeight: "800",
              color: "#6B7280",
            }}
          >
            Tap to message
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
