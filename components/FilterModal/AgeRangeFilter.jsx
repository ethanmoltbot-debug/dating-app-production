import { View, Text, TouchableOpacity } from "react-native";

export function AgeRangeFilter({ minAge, maxAge, onChange }) {
  const handleMinAgeDecrease = () => {
    onChange(Math.max(18, minAge - 1), maxAge);
  };

  const handleMinAgeIncrease = () => {
    onChange(Math.min(maxAge - 1, minAge + 1), maxAge);
  };

  const handleMaxAgeDecrease = () => {
    onChange(minAge, Math.max(minAge + 1, maxAge - 1));
  };

  const handleMaxAgeIncrease = () => {
    onChange(minAge, Math.min(99, maxAge + 1));
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
        Age Range
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 14, color: "#666" }}>{minAge} years</Text>
        <Text style={{ fontSize: 14, color: "#666" }}>{maxAge} years</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
            Min Age
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleMinAgeDecrease}
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#F5F5F5",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#2D2D2D" }}
              >
                −
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flex: 1,
                height: 40,
                backgroundColor: "#F5F5F5",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#2D2D2D" }}
              >
                {minAge}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleMinAgeIncrease}
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#F5F5F5",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#2D2D2D" }}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
            Max Age
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleMaxAgeDecrease}
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#F5F5F5",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#2D2D2D" }}
              >
                −
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flex: 1,
                height: 40,
                backgroundColor: "#F5F5F5",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#2D2D2D" }}
              >
                {maxAge}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleMaxAgeIncrease}
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#F5F5F5",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#2D2D2D" }}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
