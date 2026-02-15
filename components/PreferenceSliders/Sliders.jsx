import { useMemo, useRef, useState } from "react";
import { View, PanResponder, Pressable } from "react-native";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function roundToStep(value, min, step) {
  if (!step || step <= 1) {
    return Math.round(value);
  }
  const snapped = Math.round((value - min) / step) * step + min;
  return Math.round(snapped);
}

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 28;
const THUMB_HIT_SIZE = 44; // larger touch target (fixes iOS "stuck" / hard-to-grab behavior)

export function SingleSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  activeColor = "#FF1744",
  inactiveColor = "#E5E5EA",
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const startXRef = useRef(0);

  // keep the latest value in a ref so PanResponder doesn't get stuck on stale props
  const valueRef = useRef(value);
  valueRef.current = value;

  // NOTE: PanResponder is created once; do NOT rely on state inside its callbacks.
  // Always read latest width/values from refs.
  const valueToX = (v) => {
    const w = trackWidthRef.current;
    if (!w) return 0;
    const pct = (v - min) / (max - min);
    return clamp(pct * w, 0, w);
  };

  const xToValue = (x) => {
    const w = trackWidthRef.current;
    if (!w) return min;
    const pct = clamp(x / w, 0, 1);
    const raw = min + pct * (max - min);
    return clamp(roundToStep(raw, min, step), min, max);
  };

  const x = useMemo(() => {
    if (!trackWidth) return 0;
    const pct = (value - min) / (max - min);
    return clamp(pct * trackWidth, 0, trackWidth);
  }, [trackWidth, value, min, max]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // Prevent parent ScrollViews from stealing the gesture mid-drag
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        // use latest value + width via refs
        startXRef.current = valueToX(valueRef.current);
      },
      onPanResponderMove: (_, g) => {
        const w = trackWidthRef.current;
        const nextX = clamp(startXRef.current + g.dx, 0, w);
        const nextValue = xToValue(nextX);
        onChange(nextValue);
      },
    }),
  ).current;

  return (
    <View style={{ paddingVertical: 12, width: "100%" }}>
      <Pressable
        onPress={(e) => {
          const pressX = e?.nativeEvent?.locationX ?? 0;
          onChange(xToValue(pressX));
        }}
        style={{ paddingVertical: 12, width: "100%" }}
      >
        <View
          onLayout={(e) => {
            const w = e?.nativeEvent?.layout?.width || 0;
            trackWidthRef.current = w;
            setTrackWidth(w);
          }}
          style={{
            height: THUMB_HIT_SIZE,
            justifyContent: "center",
            width: "100%",
          }}
        >
          <View
            style={{
              height: TRACK_HEIGHT,
              backgroundColor: inactiveColor,
              borderRadius: TRACK_HEIGHT / 2,
              overflow: "hidden",
              width: "100%",
            }}
          >
            <View
              style={{
                width: x,
                height: TRACK_HEIGHT,
                backgroundColor: activeColor,
              }}
            />
          </View>

          <View
            {...panResponder.panHandlers}
            pointerEvents="box-only"
            style={{
              position: "absolute",
              left: clamp(
                x - THUMB_HIT_SIZE / 2,
                0,
                Math.max(0, trackWidth - THUMB_HIT_SIZE),
              ),
              width: THUMB_HIT_SIZE,
              height: THUMB_HIT_SIZE,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#D1D1D6",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.14,
                shadowRadius: 4,
              }}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function RangeSlider({
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onChange,
  activeColor = "#FF1744",
  inactiveColor = "#E5E5EA",
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  // keep latest values in refs so PanResponders don't capture stale min/max
  const minValueRef = useRef(minValue);
  const maxValueRef = useRef(maxValue);
  minValueRef.current = minValue;
  maxValueRef.current = maxValue;

  // Track which thumb is "on top" so when they overlap you can still grab the other one.
  const [topThumb, setTopThumb] = useState("max"); // 'min' | 'max'

  // One pan responder for the whole slider.
  // This avoids the iOS bug where the (larger) hit boxes overlap and you can accidentally
  // start dragging the wrong thumb (which feels like the thumbs "jump" and get stuck).
  const activeThumbRef = useRef("max"); // 'min' | 'max'
  const startTouchXRef = useRef(0);
  const touchOffsetRef = useRef(0); // keeps the thumb from "jumping" on drag start

  // IMPORTANT: PanResponder callbacks must not rely on state values (like trackWidth)
  // because PanResponder is created once. Always read the latest width from refs.
  const valueToXRef = (v) => {
    const w = trackWidthRef.current;
    if (!w) return 0;
    const pct = (v - min) / (max - min);
    return clamp(pct * w, 0, w);
  };

  const xToValueRef = (x) => {
    const w = trackWidthRef.current;
    if (!w) return min;
    const pct = clamp(x / w, 0, 1);
    const raw = min + pct * (max - min);
    return clamp(roundToStep(raw, min, step), min, max);
  };

  const minX = useMemo(() => {
    if (!trackWidth) return 0;
    const pct = (minValue - min) / (max - min);
    return clamp(pct * trackWidth, 0, trackWidth);
  }, [trackWidth, minValue, min, max]);

  const maxX = useMemo(() => {
    if (!trackWidth) return 0;
    const pct = (maxValue - min) / (max - min);
    return clamp(pct * trackWidth, 0, trackWidth);
  }, [trackWidth, maxValue, min, max]);

  const applyThumbMove = useMemo(() => {
    return (thumb, proposedX) => {
      const currentMin = minValueRef.current;
      const currentMax = maxValueRef.current;

      const proposedValue = xToValueRef(proposedX);

      if (thumb === "min") {
        const nextMin = clamp(proposedValue, min, currentMax - step);
        onChange({ minValue: nextMin, maxValue: currentMax });
        return;
      }

      const nextMax = clamp(proposedValue, currentMin + step, max);
      onChange({ minValue: currentMin, maxValue: nextMax });
    };
  }, [max, min, onChange, step]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        const w = trackWidthRef.current;
        if (!w) {
          return;
        }

        const touchX = Number(evt?.nativeEvent?.locationX ?? 0);
        startTouchXRef.current = touchX;

        const currentMinX = valueToXRef(minValueRef.current);
        const currentMaxX = valueToXRef(maxValueRef.current);

        const distToMin = Math.abs(touchX - currentMinX);
        const distToMax = Math.abs(touchX - currentMaxX);

        // Choose the closest thumb. If basically tied, keep whichever thumb was last on top.
        const isTie = Math.abs(distToMin - distToMax) < 6;
        const chosenThumb = isTie
          ? topThumb
          : distToMin < distToMax
            ? "min"
            : "max";

        activeThumbRef.current = chosenThumb;
        setTopThumb(chosenThumb);

        // If the user started the gesture near the thumb, keep the thumb centered under their finger.
        // Otherwise (starting on the track), we let the thumb jump to the finger (offset = 0).
        const nearThumbThreshold = THUMB_HIT_SIZE / 2 + 8;
        const chosenX = chosenThumb === "min" ? currentMinX : currentMaxX;
        const nearChosenThumb =
          Math.abs(touchX - chosenX) <= nearThumbThreshold;

        touchOffsetRef.current = nearChosenThumb ? chosenX - touchX : 0;

        // If they started on the track (not near a thumb), apply immediately so it feels like a tap-to-set.
        if (!nearChosenThumb) {
          const proposedX = clamp(touchX + touchOffsetRef.current, 0, w);
          applyThumbMove(chosenThumb, proposedX);
        }
      },
      onPanResponderMove: (_, g) => {
        const w = trackWidthRef.current;
        if (!w) {
          return;
        }

        const proposedX = clamp(
          startTouchXRef.current + g.dx + touchOffsetRef.current,
          0,
          w,
        );
        applyThumbMove(activeThumbRef.current, proposedX);
      },
    }),
  ).current;

  const left = Math.min(minX, maxX);
  const right = Math.max(minX, maxX);
  const selectedWidth = clamp(right - left, 0, trackWidth);

  const minZ = topThumb === "min" ? 3 : 2;
  const maxZ = topThumb === "max" ? 3 : 2;

  return (
    <View style={{ paddingVertical: 12, width: "100%" }}>
      <View
        {...pan.panHandlers}
        onLayout={(e) => {
          const w = e?.nativeEvent?.layout?.width || 0;
          trackWidthRef.current = w;
          setTrackWidth(w);
        }}
        style={{
          height: THUMB_HIT_SIZE,
          justifyContent: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            height: TRACK_HEIGHT,
            backgroundColor: inactiveColor,
            borderRadius: TRACK_HEIGHT / 2,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <View
            style={{
              position: "absolute",
              left,
              width: selectedWidth,
              height: TRACK_HEIGHT,
              backgroundColor: activeColor,
            }}
          />
        </View>

        {/* Min thumb (bigger touch target, but pointerEvents is none so the shared panResponder always wins) */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: clamp(
              minX - THUMB_HIT_SIZE / 2,
              0,
              Math.max(0, trackWidth - THUMB_HIT_SIZE),
            ),
            width: THUMB_HIT_SIZE,
            height: THUMB_HIT_SIZE,
            alignItems: "center",
            justifyContent: "center",
            zIndex: minZ,
          }}
        >
          <View
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#D1D1D6",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.14,
              shadowRadius: 4,
            }}
          />
        </View>

        {/* Max thumb */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: clamp(
              maxX - THUMB_HIT_SIZE / 2,
              0,
              Math.max(0, trackWidth - THUMB_HIT_SIZE),
            ),
            width: THUMB_HIT_SIZE,
            height: THUMB_HIT_SIZE,
            alignItems: "center",
            justifyContent: "center",
            zIndex: maxZ,
          }}
        >
          <View
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#D1D1D6",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.14,
              shadowRadius: 4,
            }}
          />
        </View>
      </View>
    </View>
  );
}
