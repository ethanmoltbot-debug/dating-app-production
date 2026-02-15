import { Tabs } from "expo-router";
import { Home, Star, MessageCircle, User, Compass } from "lucide-react-native";
import { View, Platform } from "react-native";
import { useEffect, useMemo } from "react";
import * as Notifications from "expo-notifications";

import useLikesBadge from "@/hooks/useLikesBadge";
import useMatchesBadge from "@/hooks/useMatchesBadge";

// Keep tab colors consistent with the pastel/purple UI used across Likes + Messages
const TAB_ACTIVE = "#7C3AED"; // purple
const TAB_INACTIVE = "#6B7280"; // neutral
const BADGE_BG = "#FF4FD8"; // pink

function BadgeDot() {
  return (
    <View
      style={{
        position: "absolute",
        right: -1,
        top: 0,
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: BADGE_BG,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.92)",
      }}
    />
  );
}

export default function TabLayout() {
  // NOTE: This layout must be extremely "safe" — if anything throws here,
  // the whole bottom tab bar disappears.

  const likesBadge = useLikesBadge();
  const matchesBadge = useMatchesBadge();

  const showLikesDot = useMemo(() => {
    return Number(likesBadge?.badgeCount || 0) > 0;
  }, [likesBadge?.badgeCount]);

  const showMessagesDot = useMemo(() => {
    return Number(matchesBadge?.badgeCount || 0) > 0;
  }, [matchesBadge?.badgeCount]);

  // Best-effort: keep the iOS app-icon badge in sync with the tab dots.
  // (This is separate from in-app tab dots.)
  useEffect(() => {
    let cancelled = false;

    const syncBadge = async () => {
      try {
        if (Platform.OS !== "ios") return;

        const perms = await Notifications.getPermissionsAsync();
        if (perms?.status !== "granted") return;

        const total =
          Number(likesBadge?.badgeCount || 0) +
          Number(matchesBadge?.badgeCount || 0);

        // Avoid unnecessary native calls.
        const current = await Notifications.getBadgeCountAsync();
        if (cancelled) return;
        if (Number(current) === Number(total)) return;

        await Notifications.setBadgeCountAsync(Number(total));
      } catch (e) {
        // Badge sync should never crash tabs
        console.error("[TABS] Could not sync app icon badge", e);
      }
    };

    syncBadge();

    return () => {
      cancelled = true;
    };
  }, [likesBadge?.badgeCount, matchesBadge?.badgeCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.92)",
          borderTopWidth: 1,
          borderColor: "rgba(17,17,17,0.08)",
          paddingTop: 4,
          // never set height for tabs
        },
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Compass color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="likes"
        options={{
          title: "Likes",
          tabBarIcon: ({ color }) => (
            <View style={{ width: 34, height: 28, overflow: "visible" }}>
              <View style={{ position: "absolute", left: 0, top: 2 }}>
                <Star color={color} size={24} />
              </View>
              {showLikesDot ? <BadgeDot /> : null}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Matches",
          tabBarIcon: ({ color }) => (
            <View style={{ width: 34, height: 28, overflow: "visible" }}>
              <View style={{ position: "absolute", left: 0, top: 2 }}>
                <MessageCircle color={color} size={24} />
              </View>
              {showMessagesDot ? <BadgeDot /> : null}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
