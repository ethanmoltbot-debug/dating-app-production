import { Stack } from "expo-router";

export default function MessagesLayout() {
  // Keep Messages inside the tab navigator, but allow pushing the thread screen.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[matchId]" />
    </Stack>
  );
}
