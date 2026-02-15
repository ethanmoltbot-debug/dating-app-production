import { useState, useRef } from "react";
import { Animated } from "react-native";

export function useQuizState() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState({
    step: 0,
    totalSteps: 0,
    currentPhase: "phase_1",
  });
  const [user, setUser] = useState(null);
  const [selectedAnswerIds, setSelectedAnswerIds] = useState([]);
  const [showingTransition, setShowingTransition] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [pendingProgress, setPendingProgress] = useState(null);
  const [transitionDurationMs, setTransitionDurationMs] = useState(2500);
  const [pendingOutcomeNav, setPendingOutcomeNav] = useState(null);
  const [error, setError] = useState(null);

  // Dev-only debugging (helps confirm male vs female quiz without needing device logs)
  const [audienceGenderUsed, setAudienceGenderUsed] = useState(null);

  const questionFadeAnim = useRef(new Animated.Value(0)).current;
  const questionSlideAnim = useRef(new Animated.Value(30)).current;
  const transitionFadeAnim = useRef(new Animated.Value(0)).current;
  const transitionScaleAnim = useRef(new Animated.Value(0.9)).current;

  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  return {
    loading,
    setLoading,
    submitting,
    setSubmitting,
    question,
    setQuestion,
    progress,
    setProgress,
    user,
    setUser,
    selectedAnswerIds,
    setSelectedAnswerIds,
    showingTransition,
    setShowingTransition,
    transitionMessage,
    setTransitionMessage,
    pendingQuestion,
    setPendingQuestion,
    pendingProgress,
    setPendingProgress,
    transitionDurationMs,
    setTransitionDurationMs,
    pendingOutcomeNav,
    setPendingOutcomeNav,
    error,
    setError,
    audienceGenderUsed,
    setAudienceGenderUsed,
    questionFadeAnim,
    questionSlideAnim,
    transitionFadeAnim,
    transitionScaleAnim,
    dot1Anim,
    dot2Anim,
    dot3Anim,
  };
}
