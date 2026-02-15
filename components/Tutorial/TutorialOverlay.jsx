import { useMemo } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";

export default function TutorialOverlay({
  title,
  body,
  stepIndex,
  totalSteps,
  placement, // { type: 'bottom' | 'top', inset: number }
  targetRect, // { x, y, width, height } from measureInWindow
  onPress,
}) {
  const { width: windowWidth } = useWindowDimensions();

  const cardPositionStyle = useMemo(() => {
    const type = placement?.type === "top" ? "top" : "bottom";
    const inset = Number.isFinite(placement?.inset) ? placement.inset : 120;

    if (type === "top") {
      return { top: inset, left: 18, right: 18 };
    }

    return { bottom: inset, left: 18, right: 18 };
  }, [placement?.inset, placement?.type]);

  const stepLabel = useMemo(() => {
    if (!Number.isFinite(stepIndex) || !Number.isFinite(totalSteps))
      return null;
    if (totalSteps <= 1) return null;
    return `${stepIndex + 1}/${totalSteps}`;
  }, [stepIndex, totalSteps]);

  const pointerStyle = useMemo(() => {
    const type = placement?.type === "top" ? "top" : "bottom";

    // default: old bottom-right pointer
    if (!targetRect || !Number.isFinite(targetRect?.x)) {
      if (type === "top") {
        return {
          placement: "top",
          triangle: {
            position: "absolute",
            right: 34,
            top: -12,
            width: 0,
            height: 0,
            borderLeftWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 12,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: "rgba(255,255,255,0.98)",
          },
        };
      }

      return {
        placement: "bottom",
        triangle: {
          position: "absolute",
          right: 34,
          bottom: -12,
          width: 0,
          height: 0,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderTopWidth: 12,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "rgba(255,255,255,0.98)",
        },
      };
    }

    const cardLeft = 18;
    const cardRight = 18;
    const cardWidth = Math.max(0, windowWidth - cardLeft - cardRight);

    const targetCenterX =
      Number(targetRect.x) + Number(targetRect.width || 0) / 2;
    const desiredLeft = targetCenterX - cardLeft - 10; // 10 = half triangle base

    // Keep triangle within the card, with some padding
    const minLeft = 26;
    const maxLeft = Math.max(minLeft, cardWidth - 46);
    const left = Math.max(minLeft, Math.min(maxLeft, desiredLeft));

    if (type === "top") {
      return {
        placement: "top",
        triangle: {
          position: "absolute",
          left,
          top: -12,
          width: 0,
          height: 0,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderBottomWidth: 12,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: "rgba(255,255,255,0.98)",
        },
      };
    }

    return {
      placement: "bottom",
      triangle: {
        position: "absolute",
        left,
        bottom: -12,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "rgba(255,255,255,0.98)",
      },
    };
  }, [placement?.type, targetRect, windowWidth]);

  const highlightStyle = useMemo(() => {
    if (!targetRect) return null;

    const x = Number(targetRect.x);
    const y = Number(targetRect.y);
    const w = Number(targetRect.width);
    const h = Number(targetRect.height);

    if (![x, y, w, h].every(Number.isFinite)) return null;

    const pad = 6;

    return {
      position: "absolute",
      left: x - pad,
      top: y - pad,
      width: w + pad * 2,
      height: h + pad * 2,
      borderRadius: Math.min((h + pad * 2) / 2, 16),
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.85)",
      backgroundColor: "rgba(255,255,255,0.10)",
    };
  }, [targetRect]);

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      {/* dim background */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      />

      {/* highlight target */}
      {highlightStyle ? (
        <View pointerEvents="none" style={highlightStyle} />
      ) : null}

      {/* card */}
      <View
        style={{
          position: "absolute",
          ...cardPositionStyle,
          backgroundColor: "rgba(255,255,255,0.98)",
          borderRadius: 22,
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: "rgba(17,17,17,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            {title ? (
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
                {title}
              </Text>
            ) : null}

            {body ? (
              <Text
                style={{
                  marginTop: title ? 8 : 0,
                  fontSize: 14,
                  color: "#111",
                  fontWeight: "700",
                  lineHeight: 20,
                }}
              >
                {body}
              </Text>
            ) : null}
          </View>

          {stepLabel ? (
            <View
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: "rgba(17,17,17,0.06)",
              }}
            >
              <Text style={{ fontWeight: "900", color: "#111", fontSize: 12 }}>
                {stepLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            marginTop: 14,
            alignSelf: "flex-end",
            backgroundColor: "#111",
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Got it</Text>
        </View>

        {/* pointer */}
        <View style={pointerStyle.triangle} />
      </View>
    </Pressable>
  );
}
