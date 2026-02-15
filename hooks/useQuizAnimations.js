import { useEffect } from "react";
import { Animated } from "react-native";

export function useQuizAnimations({
  question,
  showingTransition,
  questionFadeAnim,
  questionSlideAnim,
  transitionFadeAnim,
  transitionScaleAnim,
  dot1Anim,
  dot2Anim,
  dot3Anim,
  transitionDurationMs,
  pendingOutcomeNav,
  pendingQuestion,
  pendingProgress,
  setShowingTransition,
  setQuestion,
  setPendingQuestion,
  setProgress,
  setPendingProgress,
  setPendingOutcomeNav,
  router,
}) {
  // Animate question appearance
  useEffect(() => {
    if (question && !showingTransition) {
      questionFadeAnim.setValue(0);
      questionSlideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(questionFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(questionSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [question, showingTransition, questionFadeAnim, questionSlideAnim]);

  // Animate transition screen
  useEffect(() => {
    if (showingTransition) {
      transitionFadeAnim.setValue(0);
      transitionScaleAnim.setValue(0.9);

      Animated.parallel([
        Animated.timing(transitionFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(transitionScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate loading dots
      const createDotAnimation = (dotAnim, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dotAnim, {
              toValue: -12,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        );
      };

      const dotAnimations = Animated.parallel([
        createDotAnimation(dot1Anim, 0),
        createDotAnimation(dot2Anim, 150),
        createDotAnimation(dot3Anim, 300),
      ]);

      dotAnimations.start();

      const timer = setTimeout(() => {
        dotAnimations.stop();
        dot1Anim.setValue(0);
        dot2Anim.setValue(0);
        dot3Anim.setValue(0);
        setShowingTransition(false);

        // If we're in an "outcome" transition, navigate after the delay.
        if (pendingOutcomeNav?.outcome) {
          const outcome = pendingOutcomeNav.outcome;
          const cooldownUntil = pendingOutcomeNav.cooldownUntil;

          setPendingOutcomeNav(null);

          if (outcome === "COOLDOWN") {
            const untilParam = cooldownUntil
              ? `?until=${encodeURIComponent(cooldownUntil)}`
              : "";
            router.replace(`/screening/cooldown${untilParam}`);
          } else {
            router.replace(`/screening/outcome?result=${outcome}`);
          }

          return;
        }

        // Otherwise, it's a normal phase transition
        if (pendingQuestion) {
          setQuestion(pendingQuestion);
          setPendingQuestion(null);
        }
        if (pendingProgress) {
          setProgress(pendingProgress);
          setPendingProgress(null);
        }
      }, transitionDurationMs);

      return () => {
        clearTimeout(timer);
        dotAnimations.stop();
      };
    }
  }, [
    showingTransition,
    transitionDurationMs,
    pendingOutcomeNav,
    pendingQuestion,
    pendingProgress,
    transitionFadeAnim,
    transitionScaleAnim,
    dot1Anim,
    dot2Anim,
    dot3Anim,
    setShowingTransition,
    setQuestion,
    setPendingQuestion,
    setProgress,
    setPendingProgress,
    setPendingOutcomeNav,
    router,
  ]);
}
