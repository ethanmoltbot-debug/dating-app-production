import { View, Text, Pressable } from "react-native";
import { RotateCcw, SlidersHorizontal } from "lucide-react-native";

export function HomeHeader({
  onFilterPress,
  onRewindPress,
  canRewind = false,
  topInset,
  onLayout,
  style,
  variant,
  filterRef, // allows tutorial to measure filter button
  onTitleLongPress,
}) {
  const isDark = variant === "dark";
  const isLight = variant === "light";

  const titleColor = isDark ? "#fff" : "#111827";
  const iconColor = isDark ? "#FF1744" : "#111827";
  const pressedBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.06)";

  const rewindOpacity = canRewind ? 1 : 0.35;

  // Match screenshot: filter looks like a pill button (not just an icon)
  const filterPillBg = isDark ? "transparent" : "rgba(255,255,255,0.75)";
  const filterPillPressedBg = isDark ? pressedBg : "rgba(255,255,255,0.92)";
  const filterPillBorder = isDark ? "transparent" : "rgba(17,24,39,0.10)";

  return (
    <View
      onLayout={onLayout}
      pointerEvents="auto"
      style={{
        paddingTop: topInset + 10,
        paddingHorizontal: 18,
        paddingBottom: 10,
        backgroundColor: isDark ? "rgba(11,11,16,0.92)" : "#F6F2EE",
        position: "relative",
        zIndex: 50,
        ...(style || {}),
      }}
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pressable
          onLongPress={onTitleLongPress}
          delayLongPress={450}
          hitSlop={10}
          style={({ pressed }) => ({
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 4,
            marginLeft: -6,
            backgroundColor:
              pressed && typeof onTitleLongPress === "function"
                ? pressedBg
                : "transparent",
          })}
          accessibilityRole={
            typeof onTitleLongPress === "function" ? "button" : "none"
          }
          accessibilityLabel="Wifey"
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: titleColor,
              letterSpacing: 0.2,
            }}
          >
            Wifey
          </Text>
        </Pressable>

        {/* Right actions: rewind (left) + filter (right) */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={onRewindPress}
            disabled={!canRewind}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed && canRewind ? pressedBg : "transparent",
              opacity: rewindOpacity,
            })}
            accessibilityRole="button"
            accessibilityLabel="Rewind"
          >
            <RotateCcw size={22} color={iconColor} />
          </Pressable>

          <Pressable
            ref={filterRef}
            onPress={onFilterPress}
            hitSlop={12}
            style={({ pressed }) => {
              if (!isLight) {
                return {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? pressedBg : "transparent",
                };
              }

              return {
                paddingHorizontal: 14,
                height: 40,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                backgroundColor: pressed ? filterPillPressedBg : filterPillBg,
                borderWidth: 1,
                borderColor: filterPillBorder,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
              };
            }}
            accessibilityRole="button"
            accessibilityLabel="Filter profiles"
          >
            <SlidersHorizontal size={20} color={iconColor} />
            {isLight ? (
              <Text style={{ color: titleColor, fontWeight: "900" }}>
                Filter
              </Text>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
