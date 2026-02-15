import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Dimensions,
  ScrollView,
  Platform,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const AnimatedImage = Animated.createAnimatedComponent(Image);

function clamp(n, min, max) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function ZoomablePhotoPage({ uri, onClose, resetKey }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    // reset zoom when changing pages
    scale.value = withTiming(1, { duration: 120 });
    savedScale.value = 1;
  }, [resetKey, scale, savedScale]);

  const onCloseSafe = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .onUpdate((e) => {
        const next = savedScale.value * e.scale;
        scale.value = clamp(next, 1, 3);
      })
      .onEnd(() => {
        const snapped = scale.value < 1.02 ? 1 : scale.value;
        scale.value = withTiming(snapped, { duration: 120 });
        savedScale.value = snapped;
      });
  }, [scale, savedScale]);

  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .numberOfTaps(1)
      .maxDistance(14)
      .onStart(() => {
        runOnJS(onCloseSafe)();
      });
  }, [onCloseSafe]);

  const composed = useMemo(() => {
    // One-finger tap closes; two-finger pinch zooms.
    return Gesture.Simultaneous(tapGesture, pinchGesture);
  }, [pinchGesture, tapGesture]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <View
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedImage
          source={uri}
          contentFit="contain"
          transition={80}
          style={[
            {
              width: "100%",
              height: "100%",
            },
            animatedStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

export default function PhotoViewerModal({
  visible,
  uris,
  initialIndex,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const { width, height } = Dimensions.get("window");

  const cleanUris = useMemo(() => {
    const arr = Array.isArray(uris) ? uris : [];
    return arr.filter((u) => typeof u === "string" && u.length > 0);
  }, [uris]);

  const safeInitial = useMemo(() => {
    const n = Number(initialIndex);
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n >= cleanUris.length) return 0;
    return n;
  }, [cleanUris.length, initialIndex]);

  const [activeIndex, setActiveIndex] = useState(safeInitial);

  useEffect(() => {
    // keep active index aligned if caller changes it
    setActiveIndex(safeInitial);
  }, [safeInitial]);

  useEffect(() => {
    if (!visible) return;

    // On Android, scrollTo can be flaky until next tick.
    const id = setTimeout(
      () => {
        try {
          const x = safeInitial * width;
          scrollRef.current?.scrollTo({ x, y: 0, animated: false });
        } catch {
          // ignore
        }
      },
      Platform.OS === "android" ? 60 : 0,
    );

    return () => clearTimeout(id);
  }, [safeInitial, visible, width]);

  const onMomentumEnd = useCallback(
    (e) => {
      const x = e?.nativeEvent?.contentOffset?.x;
      const next = Math.round(Number(x || 0) / width);
      if (Number.isFinite(next)) {
        setActiveIndex(clamp(next, 0, Math.max(0, cleanUris.length - 1)));
      }
    },
    [cleanUris.length, width],
  );

  const showDots = cleanUris.length > 1;
  const showCounter = cleanUris.length > 1;

  const counterLabel = useMemo(() => {
    if (!showCounter) return "";
    const current = activeIndex + 1;
    const total = cleanUris.length;
    return `${current} / ${total}`;
  }, [activeIndex, cleanUris.length, showCounter]);

  const dotViews = useMemo(() => {
    if (!showDots) {
      return null;
    }

    return cleanUris.map((_, idx) => {
      const isActive = idx === activeIndex;
      const opacity = isActive ? 1 : 0.35;
      const size = 7;

      return (
        <View
          key={`dot-${idx}`}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#fff",
            opacity,
            marginHorizontal: 4,
          }}
        />
      );
    });
  }, [activeIndex, cleanUris, showDots]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar style="light" />

      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {showCounter ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 10,
              left: 0,
              right: 0,
              zIndex: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.35)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: "700",
                  letterSpacing: 0.2,
                }}
              >
                {counterLabel}
              </Text>
            </View>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          style={{ flex: 1 }}
        >
          {cleanUris.map((uri, idx) => {
            const key = `${uri}-${idx}`;
            const resetKey = `${activeIndex}`;

            return (
              <View
                key={key}
                style={{
                  width,
                  height: height - insets.top - insets.bottom,
                }}
              >
                <ZoomablePhotoPage
                  uri={uri}
                  onClose={onClose}
                  resetKey={resetKey}
                />
              </View>
            );
          })}
        </ScrollView>

        {showDots ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.35)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              {dotViews}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
