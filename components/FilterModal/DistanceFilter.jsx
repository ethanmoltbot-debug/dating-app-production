import { View, Text, TouchableOpacity } from "react-native";

export function DistanceFilter({ maxDistance, onChange }) {
  const handleDecrease = () => {
    onChange(Math.max(1, maxDistance - 5));
  };

  const handleIncrease = () => {
    onChange(Math.min(500, maxDistance + 5));
  };

  return (
    <View style={{ marginBottom: 32 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#2D2D2D",
          marginBottom: 16,
        }}
      >
        Maximum Distance
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 14, color: "#666" }}>{maxDistance} miles</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={handleDecrease}
          style={{
            width: 50,
            height: 44,
            backgroundColor: "#F5F5F5",
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#2D2D2D" }}>
            −
          </Text>
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            height: 44,
            backgroundColor: "#F5F5F5",
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#2D2D2D" }}>
            {maxDistance} mi
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleIncrease}
          style={{
            width: 50,
            height: 44,
            backgroundColor: "#F5F5F5",
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#2D2D2D" }}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
