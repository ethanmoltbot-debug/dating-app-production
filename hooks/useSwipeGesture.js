import { useRef } from "react";
import { Animated, PanResponder, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export function useSwipeGesture(swipeThreshold, onSwipe) {
  const position = useRef(new Animated.ValueXY()).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const nextCardScale = useRef(new Animated.Value(0.9)).current;

  const panResponder = useRef(
    PanResponder.create({
      // IMPORTANT: don't capture taps immediately.
      // This prevents the swipe layer from stealing taps from the header (filter button).
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Allow vertical scrolling inside the profile card.
        // Only start swipe if the gesture is primarily horizontal.
        const dx = Math.abs(gesture.dx);
        const dy = Math.abs(gesture.dy);

        if (dx < 8) {
          return false;
        }

        return dx > dy * 1.2;
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        swipeAnim.setValue(Math.abs(gesture.dx) / swipeThreshold);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > swipeThreshold) {
          handleSwipe("right");
        } else if (gesture.dx < -swipeThreshold) {
          handleSwipe("left");
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  const handleSwipe = async (direction) => {
    Animated.timing(position, {
      toValue: {
        x: direction === "right" ? width + 100 : -width - 100,
        y: 0,
      },
      duration: 300,
      useNativeDriver: false,
    }).start(async () => {
      await onSwipe(direction);
      position.setValue({ x: 0, y: 0 });
      swipeAnim.setValue(0);

      Animated.spring(nextCardScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start(() => {
        nextCardScale.setValue(0.9);
      });
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false,
    }).start();
    swipeAnim.setValue(0);
  };

  return {
    position,
    swipeAnim,
    nextCardScale,
    panResponder,
    handleSwipe,
  };
}
