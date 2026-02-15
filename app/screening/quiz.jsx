import { useEffect, useCallback } from "react";
import { View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "@/utils/auth/useAuth";
import { useQuizState } from "@/hooks/useQuizState";
import { useQuizAnimations } from "@/hooks/useQuizAnimations";
import { useQuizApi } from "@/hooks/useQuizApi";
import { buildApiUrl, QUIZ_CONSTANTS } from "@/utils/quizHelpers";
import { SoftBlobsBackground } from "@/components/QuizScreen/SoftBlobsBackground";
import { QuizHeader } from "@/components/QuizScreen/QuizHeader";
import { QuestionCard } from "@/components/QuizScreen/QuestionCard";
import { NextButton } from "@/components/QuizScreen/NextButton";
import { TransitionScreen } from "@/components/QuizScreen/TransitionScreen";
import { LoadingScreen } from "@/components/QuizScreen/LoadingScreen";
import { ErrorScreen } from "@/components/QuizScreen/ErrorScreen";

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { auth, isReady: authReady, isAuthenticated } = useAuth();

  const state = useQuizState();
  const {
    loading,
    submitting,
    question,
    progress,
    user,
    selectedAnswerIds,
    showingTransition,
    transitionMessage,
    error,
    setLoading,
    setSubmitting,
    setSelectedAnswerIds,
    questionFadeAnim,
    questionSlideAnim,
    transitionFadeAnim,
    transitionScaleAnim,
    dot1Anim,
    dot2Anim,
    dot3Anim,
  } = state;

  const apiUrl = useCallback((path) => buildApiUrl(path), []);

  const api = useQuizApi({
    apiUrl,
    auth,
    authReady,
    isAuthenticated,
    router,
    ...state,
  });

  const { loadUserAndStartQuiz, startQuiz, submitAnswer } = api;

  useQuizAnimations({
    question,
    showingTransition,
    questionFadeAnim,
    questionSlideAnim,
    transitionFadeAnim,
    transitionScaleAnim,
    dot1Anim,
    dot2Anim,
    dot3Anim,
    router,
    ...state,
  });

  useEffect(() => {
    loadUserAndStartQuiz();
  }, [authReady]);

  const handleNext = async () => {
    if (!selectedAnswerIds.length || !user || submitting) return;

    setSubmitting(true);

    try {
      await submitAnswer(user, question, selectedAnswerIds);
      setSelectedAnswerIds([]);
    } catch (err) {
      console.error("Error submitting answer:", err);
      Alert.alert("Could not submit", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAnswer = (answerId) => {
    const id = String(answerId);
    const allowMultiple = !!question?.allowMultiple;

    if (!allowMultiple) {
      setSelectedAnswerIds([id]);
      return;
    }

    setSelectedAnswerIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      if (safePrev.includes(id)) {
        return safePrev.filter((x) => x !== id);
      }
      return [...safePrev, id];
    });
  };

  const handleRetry = () => {
    if (!user?.id) {
      router.replace("/auth/login");
      return;
    }
    setLoading(true);
    startQuiz(user.id, { audienceGender: user?.gender });
  };

  const handleBack = () => {
    router.replace("/screening/gate");
  };

  const { BG_GRADIENT, CTA_GRADIENT, ACCENT } = QUIZ_CONSTANTS;

  if (loading) {
    return <LoadingScreen bgGradient={BG_GRADIENT} accent={ACCENT} />;
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={handleRetry}
        onBack={handleBack}
        bgGradient={BG_GRADIENT}
        ctaGradient={CTA_GRADIENT}
      />
    );
  }

  if (showingTransition) {
    return (
      <TransitionScreen
        message={transitionMessage}
        bgGradient={BG_GRADIENT}
        accent={ACCENT}
        transitionFadeAnim={transitionFadeAnim}
        transitionScaleAnim={transitionScaleAnim}
        dot1Anim={dot1Anim}
        dot2Anim={dot2Anim}
        dot3Anim={dot3Anim}
      />
    );
  }

  const isNextEnabled = selectedAnswerIds.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
        <QuizHeader progress={progress} accent={ACCENT} />
      </View>

      <QuestionCard
        question={question}
        selectedAnswerIds={selectedAnswerIds}
        onToggleAnswer={toggleAnswer}
        submitting={submitting}
        accent={ACCENT}
        questionFadeAnim={questionFadeAnim}
        questionSlideAnim={questionSlideAnim}
      />

      <NextButton
        onPress={handleNext}
        isEnabled={isNextEnabled}
        submitting={submitting}
        ctaGradient={CTA_GRADIENT}
      />
    </View>
  );
}
