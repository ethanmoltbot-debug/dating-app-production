import { useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PHASE_TRANSITIONS = {
  phase_2: "Let's keep going",
  phase_3: "You're making progress",
  phase_4: "Almost there",
};

export function useQuizApi({
  apiUrl,
  auth,
  authReady,
  isAuthenticated,
  setUser,
  setQuestion,
  setProgress,
  setError,
  setLoading,
  setTransitionMessage,
  setTransitionDurationMs,
  setPendingOutcomeNav,
  setShowingTransition,
  setPendingQuestion,
  setPendingProgress,
  progress,
  router,
  setAudienceGenderUsed,
}) {
  const resetToOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("onboarding_seen");
    } catch (e) {
      console.error(e);
    }

    router.replace("/onboarding");
  }, [router]);

  const ensureLegacyUserFromAuth = useCallback(async () => {
    try {
      if (!authReady || !isAuthenticated) {
        return null;
      }

      const jwt = auth?.jwt;
      if (!jwt) {
        return null;
      }

      const resp = await fetch(apiUrl("/api/users/ensure"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `When calling /api/users/ensure, the response was [${resp.status}] ${resp.statusText} ${text}`,
        );
      }

      const json = await resp.json().catch(() => null);
      const ensuredUser = json?.user || null;

      if (ensuredUser?.id) {
        await AsyncStorage.setItem("user", JSON.stringify(ensuredUser));
        setUser(ensuredUser);
        return ensuredUser;
      }

      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [apiUrl, auth?.jwt, authReady, isAuthenticated, setUser]);

  const ensureProfileGenderMatchesUser = useCallback(
    async (u) => {
      try {
        const desired = u?.gender;
        if (desired !== "Male" && desired !== "Female") {
          return;
        }

        const userId = Number(u?.id);
        if (!Number.isFinite(userId)) {
          return;
        }

        const resp = await fetch(apiUrl(`/api/profile/me?userId=${userId}`));
        if (!resp.ok) {
          return;
        }

        const json = await resp.json().catch(() => null);
        const profile = json?.profile || null;
        const current = profile?.gender;

        if (current === desired) {
          return;
        }

        await fetch(apiUrl("/api/profile/me"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            gender: desired,
          }),
        }).catch(() => null);
      } catch (e) {
        console.error(e);
      }
    },
    [apiUrl],
  );

  const startQuiz = useCallback(
    async (userId, opts = {}) => {
      try {
        setError(null);
        // clear any stale debug value before we load
        if (typeof setAudienceGenderUsed === "function") {
          setAudienceGenderUsed(null);
        }

        const audienceGender = opts?.audienceGender;
        const response = await fetch(apiUrl("/api/quiz/start"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: Number(userId),
            // Help the server pick the correct quiz even if the profile gender is stale.
            audienceGender,
          }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            const ensured = await ensureLegacyUserFromAuth();
            if (ensured?.id) {
              return await startQuiz(ensured.id, {
                audienceGender: ensured?.gender,
              });
            }

            setError({ message: "Your account was removed.", type: "DELETED" });
            setTimeout(() => {
              resetToOnboarding();
            }, 900);
            return;
          }

          if (response.status === 403) {
            setError({
              message: "Photo verification required.",
              type: "VERIFY",
            });
            setTimeout(() => {
              router.replace("/screening/gate");
            }, 600);
            return;
          }

          const text = await response.text().catch(() => "");
          throw new Error(
            `Failed to start screening: [${response.status}] ${response.statusText} ${text}`,
          );
        }

        const data = await response.json();

        // Helpful breadcrumb while debugging quiz-audience issues.
        if (data?.audienceGenderUsed) {
          if (typeof setAudienceGenderUsed === "function") {
            setAudienceGenderUsed(String(data.audienceGenderUsed));
          }
          console.log("[QUIZ] audienceGenderUsed:", data.audienceGenderUsed);
        }

        if (data.outcome) {
          setTransitionMessage("Reviewing your answers");
          setTransitionDurationMs(1200 + Math.floor(Math.random() * 500));

          if (data.outcome === "COOLDOWN") {
            try {
              const raw = await AsyncStorage.getItem("user");
              if (raw) {
                const u = JSON.parse(raw);
                const next = {
                  ...(u || {}),
                  status: "COOLDOWN",
                  cooldownUntil: data.cooldownUntil || u.cooldownUntil,
                };
                await AsyncStorage.setItem("user", JSON.stringify(next));
              }
            } catch {
              // ignore
            }

            setPendingOutcomeNav({
              outcome: "COOLDOWN",
              cooldownUntil: data.cooldownUntil,
            });
          } else {
            setPendingOutcomeNav({ outcome: data.outcome });
          }

          setShowingTransition(true);
          return;
        }

        if (!data.question || !Array.isArray(data.question.answers)) {
          setError({
            message: "Screening is not available right now. Please try again.",
            type: "SERVER",
          });
          return;
        }

        setQuestion(data.question);
        setProgress(
          data.progress || { step: 1, totalSteps: 1, currentPhase: "phase_1" },
        );
      } catch (err) {
        console.error("Error starting quiz:", err);
        setError({
          message:
            err?.message || "Could not start the screening. Please try again.",
          type: "NETWORK",
        });
        Alert.alert(
          "Could not start screening",
          err?.message || "Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      apiUrl,
      ensureLegacyUserFromAuth,
      resetToOnboarding,
      router,
      setAudienceGenderUsed,
      setError,
      setLoading,
      setPendingOutcomeNav,
      setProgress,
      setQuestion,
      setShowingTransition,
      setTransitionDurationMs,
      setTransitionMessage,
    ],
  );

  const loadUserAndStartQuiz = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        const ensured = await ensureLegacyUserFromAuth();
        if (!ensured?.id) {
          setError({
            message: "Please sign in to start the screening.",
            type: "AUTH",
          });
          setLoading(false);
          return;
        }

        setUser(ensured);
        await startQuiz(ensured.id, { audienceGender: ensured?.gender });
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.id) {
        setError({
          message: "We couldn't find your account on this device.",
          type: "AUTH",
        });
        setLoading(false);
        return;
      }

      setUser(parsedUser);
      await ensureProfileGenderMatchesUser(parsedUser);
      await startQuiz(parsedUser.id, { audienceGender: parsedUser?.gender });
    } catch (e) {
      console.error(e);
      setError({
        message: "Something went wrong starting the screening.",
        type: "UNKNOWN",
      });
      setLoading(false);
    }
  }, [
    ensureLegacyUserFromAuth,
    ensureProfileGenderMatchesUser,
    setError,
    setLoading,
    setUser,
    startQuiz,
  ]);

  const submitAnswer = useCallback(
    async (user, question, selectedAnswerIds) => {
      try {
        const response = await fetch(apiUrl("/api/quiz/answer"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: Number(user.id),
            questionId: question.id,
            answerIds: selectedAnswerIds,
          }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError({ message: "Your account was removed.", type: "DELETED" });
            setTimeout(() => {
              resetToOnboarding();
            }, 900);
            return null;
          }

          if (response.status === 403) {
            setError({
              message: "Photo verification required.",
              type: "VERIFY",
            });
            setTimeout(() => {
              router.replace("/screening/gate");
            }, 600);
            return null;
          }

          const text = await response.text().catch(() => "");
          throw new Error(
            `Failed to submit answer: [${response.status}] ${response.statusText} ${text}`,
          );
        }

        const data = await response.json();

        if (data.outcome) {
          setTransitionMessage("Finalizing your screening");
          setTransitionDurationMs(1200 + Math.floor(Math.random() * 500));

          if (data.outcome === "COOLDOWN") {
            try {
              const raw = await AsyncStorage.getItem("user");
              if (raw) {
                const u = JSON.parse(raw);
                const next = {
                  ...(u || {}),
                  status: "COOLDOWN",
                  cooldownUntil: data.cooldownUntil || u.cooldownUntil,
                };
                await AsyncStorage.setItem("user", JSON.stringify(next));
              }
            } catch {
              // ignore
            }

            setPendingOutcomeNav({
              outcome: "COOLDOWN",
              cooldownUntil: data.cooldownUntil,
            });
          } else {
            setPendingOutcomeNav({ outcome: data.outcome });
          }

          setShowingTransition(true);
          return null;
        }

        const newProgress = data.progress || progress;

        if (
          newProgress.currentPhase !== progress.currentPhase &&
          PHASE_TRANSITIONS[newProgress.currentPhase]
        ) {
          setTransitionMessage(PHASE_TRANSITIONS[newProgress.currentPhase]);
          setTransitionDurationMs(2500);
          setPendingQuestion(data.question);
          setPendingProgress(newProgress);
          setShowingTransition(true);
        } else {
          setQuestion(data.question);
          setProgress(newProgress);
        }

        return data;
      } catch (err) {
        console.error("Error submitting answer:", err);
        setError({
          message:
            err?.message || "Could not submit your answer. Please try again.",
          type: "NETWORK",
        });
        Alert.alert("Could not submit", err?.message || "Please try again.");
        return null;
      }
    },
    [
      apiUrl,
      progress,
      resetToOnboarding,
      router,
      setError,
      setPendingOutcomeNav,
      setPendingProgress,
      setPendingQuestion,
      setProgress,
      setQuestion,
      setShowingTransition,
      setTransitionDurationMs,
      setTransitionMessage,
    ],
  );

  return {
    loadUserAndStartQuiz,
    startQuiz,
    submitAnswer,
    resetToOnboarding,
  };
}
