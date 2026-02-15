import { Image, Animated, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export function NextProfileCard({ profile, scale }) {
  if (!profile) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: width - 40,
        height: height - 250,
        backgroundColor: "#fff",
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        transform: [{ scale }],
      }}
    >
      <Image
        source={{
          uri: profile.photos?.[0] || "https://via.placeholder.com/400",
        }}
        style={{ width: "100%", height: "100%", borderRadius: 20 }}
        resizeMode="cover"
      />
    </Animated.View>
  );
}
