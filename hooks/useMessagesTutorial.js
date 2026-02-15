import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export function useMessagesTutorial(user, matches, insets) {
  const [tutorialStep, setTutorialStep] = useState(-1);
  const firstMatchRef = useRef(null);
  const [firstMatchRect, setFirstMatchRect] = useState(null);

  const tutorialSteps = useMemo(() => {
    return [
      {
        title: "Chats",
        body: "When you match, your chats show up here. Tap a match to open the conversation.",
        placement: { type: "bottom" },
        targetKey: "firstMatch",
      },
    ];
  }, []);

  const tutorialKey = useMemo(() => {
    return "wifey:tutorial:v1:messages";
  }, []);

  const maybeShowTutorial = useCallback(async () => {
    try {
      if (!user?.id) return;
      if (user?.status !== "APPROVED") return;

      const seen = await AsyncStorage.getItem(tutorialKey);
      if (!seen) {
        setTutorialStep(0);
      }
    } catch (e) {
      console.error(e);
    }
  }, [tutorialKey, user?.id, user?.status]);

  useEffect(() => {
    maybeShowTutorial();
  }, [maybeShowTutorial]);

  useFocusEffect(
    useCallback(() => {
      maybeShowTutorial();
    }, [maybeShowTutorial]),
  );

  const dismissTutorial = useCallback(async () => {
    try {
      setTutorialStep(-1);
      await AsyncStorage.setItem(tutorialKey, "1");
    } catch (e) {
      console.error(e);
      setTutorialStep(-1);
    }
  }, [tutorialKey]);

  const advanceTutorial = useCallback(() => {
    setTutorialStep((s) => {
      const next = s + 1;
      if (next >= tutorialSteps.length) {
        dismissTutorial();
        return -1;
      }
      return next;
    });
  }, [dismissTutorial, tutorialSteps.length]);

  const tutorial = tutorialStep >= 0 ? tutorialSteps[tutorialStep] : null;

  const tutorialPlacement = useMemo(() => {
    if (!tutorial) return null;
    return { type: "bottom", inset: insets.bottom + 140 };
  }, [insets.bottom, tutorial]);

  useEffect(() => {
    let cancelled = false;

    const shouldMeasure =
      tutorialStep >= 0 &&
      tutorialSteps[tutorialStep]?.targetKey === "firstMatch" &&
      Array.isArray(matches) &&
      matches.length > 0;

    if (!shouldMeasure) {
      setFirstMatchRect(null);
      return;
    }

    const measure = () => {
      try {
        const node = firstMatchRef.current;
        if (!node || typeof node.measureInWindow !== "function") {
          return;
        }

        node.measureInWindow((x, y, width, height) => {
          if (cancelled) return;
          if (![x, y, width, height].every(Number.isFinite)) return;
          setFirstMatchRect({ x, y, width, height });
        });
      } catch (e) {
        console.error(e);
      }
    };

    const t = setTimeout(measure, 60);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [matches, tutorialStep, tutorialSteps]);

  return {
    tutorialStep,
    tutorial,
    tutorialPlacement,
    firstMatchRef,
    firstMatchRect,
    advanceTutorial,
  };
}
