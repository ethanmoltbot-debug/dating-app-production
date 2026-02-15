import { View, Text, TouchableOpacity } from "react-native";

export function LockedChatSlot({ index, onPress }) {
  return (
    <TouchableOpacity
      key={`locked-chat-slot-${index}`}
      onPress={onPress}
      activeOpacity={0.9}
      style={{ marginBottom: 12 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          backgroundColor: "rgba(255, 79, 216, 0.08)",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(255, 79, 216, 0.18)",
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "rgba(255, 79, 216, 0.16)",
            marginRight: 14,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "900",
              color: "#111",
            }}
          >
            Unlock another chat
          </Text>
          <Text
            style={{ marginTop: 4, fontSize: 13, color: "#6B7280" }}
            numberOfLines={1}
          >
            Upgrade to Committed to chat with up to 3 matches.
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
