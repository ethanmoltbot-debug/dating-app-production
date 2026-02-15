import { useEffect, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, Image, Animated } from "react-native";
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  User,
  GlassWater,
} from "lucide-react-native";

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return null;
  const d = new Date(lastSeenAt);
  if (Number.isNaN(d.getTime())) return null;

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 60_000) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ConversationHeader({
  insets,
  router,
  headerTitle,
  headerAvatarUri,
  headerInitial,
  openOtherProfile,
  handleCall,
  setMenuOpen,
  drinkState,
  onPressDrink,
  otherIsOnline,
  otherLastSeenAt,
}) {
  const state = String(drinkState || "LOCKED");

  const baseOpacity =
    state === "REDEEMED"
      ? 0.5
      : state === "READY"
        ? 1
        : state === "ARMED"
          ? 0.7
          : 0.35;

  const color = state === "READY" ? "#FF1744" : "#2D2D2D";

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== "READY") {
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [pulse, state]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const label = useMemo(() => {
    if (state === "REDEEMED") return "Used";
    if (state === "ARMED") return "Ready";
    return null;
  }, [state]);

  const presenceText = useMemo(() => {
    if (otherIsOnline) return "Online";
    const last = formatLastSeen(otherLastSeenAt);
    // Keep this minimal: the dot already communicates online/offline.
    // If we have a last-seen timestamp, show it; otherwise, show nothing.
    return last ? last : null;
  }, [otherIsOnline, otherLastSeenAt]);

  const presenceDot = otherIsOnline ? "#22C55E" : "#9CA3AF";
  const presenceBg = otherIsOnline
    ? "rgba(34, 197, 94, 0.14)"
    : "rgba(156, 163, 175, 0.14)";
  const presenceFg = otherIsOnline ? "#16A34A" : "#6B7280";

  const goBackToMessages = () => {
    // We want the back arrow to always return to the Messages list.
    // Using router.back() can pop you back to the Home tab depending on how you entered the chat.
    try {
      router.replace("/messages");
    } catch (e) {
      console.error(e);
      try {
        router.back();
      } catch {
        // no-op
      }
    }
  };

  return (
    <View
      style={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: "rgba(255,255,255,0.82)",
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(17,17,17,0.06)",
      }}
    >
      <TouchableOpacity onPress={goBackToMessages} style={{ marginRight: 8 }}>
        <ArrowLeft size={24} color="#2D2D2D" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={openOtherProfile}
        activeOpacity={0.85}
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 4,
        }}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
      >
        {headerAvatarUri ? (
          <Image
            source={{ uri: headerAvatarUri }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#E5E5E5",
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#F5F5F5",
              borderWidth: 1,
              borderColor: "#E5E5E5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {headerInitial ? (
              <Text
                style={{ fontSize: 14, fontWeight: "800", color: "#2D2D2D" }}
              >
                {headerInitial}
              </Text>
            ) : (
              <User size={18} color="#2D2D2D" />
            )}
          </View>
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ fontSize: 18, fontWeight: "700", color: "#111" }}
            numberOfLines={1}
          >
            {headerTitle}
          </Text>

          <View
            style={{
              marginTop: 4,
              alignSelf: "flex-start",
              backgroundColor: presenceBg,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: presenceDot,
              }}
            />
            {presenceText ? (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "900",
                  color: presenceFg,
                }}
                numberOfLines={1}
              >
                {presenceText}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Drink on Us */}
      <TouchableOpacity
        onPress={onPressDrink}
        style={{ paddingHorizontal: 10, paddingVertical: 6 }}
        accessibilityLabel="Drink on Us"
      >
        <Animated.View
          style={{
            transform: [{ scale: state === "READY" ? scale : 1 }],
            opacity: baseOpacity,
            alignItems: "center",
          }}
        >
          <GlassWater size={22} color={color} />
          {label ? (
            <Text
              style={{
                marginTop: 2,
                fontSize: 10,
                fontWeight: "900",
                color: "#6B7280",
              }}
            >
              {label}
            </Text>
          ) : null}
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleCall}
        style={{ paddingHorizontal: 10, paddingVertical: 6 }}
        accessibilityLabel="Call"
      >
        <Phone size={22} color="#2D2D2D" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMenuOpen(true)}
        style={{ paddingHorizontal: 10, paddingVertical: 6 }}
        accessibilityLabel="More"
      >
        <MoreVertical size={22} color="#2D2D2D" />
      </TouchableOpacity>
    </View>
  );
}
