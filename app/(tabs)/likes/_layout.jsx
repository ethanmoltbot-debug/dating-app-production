import { Stack } from "expo-router";

export default function LikesLayout() {
  // Keep Likes inside the tab bar, but allow pushing deeper screens (like viewing a liker profile)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile/[userId]" />
    </Stack>
  );
}
