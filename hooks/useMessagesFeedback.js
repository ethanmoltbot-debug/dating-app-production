import { useState, useEffect, useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { usePendingDateFeedback } from "@/hooks/usePendingDateFeedback";

export function useMessagesFeedback(user) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState(null);
  const queryClient = useQueryClient();

  const pendingKey = useMemo(() => {
    const uid = Number(user?.id);
    return ["pendingDateFeedback", uid];
  }, [user?.id]);

  const pendingFeedbackQuery = usePendingDateFeedback(user?.id);

  const maybeOpenFeedbackPrompt = useCallback(
    (pending) => {
      if (feedbackOpen) return;
      const list = Array.isArray(pending) ? pending : [];
      if (list.length === 0) return;
      const first = list[0];
      setActiveFeedback(first);
      setFeedbackOpen(true);
    },
    [feedbackOpen],
  );

  useEffect(() => {
    if (!user?.id) return;
    if (!pendingFeedbackQuery.isSuccess) return;
    const pending = pendingFeedbackQuery.data?.pending || [];
    maybeOpenFeedbackPrompt(pending);
  }, [
    maybeOpenFeedbackPrompt,
    pendingFeedbackQuery.data?.pending,
    pendingFeedbackQuery.isSuccess,
    user?.id,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        return;
      }

      pendingFeedbackQuery
        .refetch()
        .then((result) => {
          const pending = result?.data?.pending || [];
          maybeOpenFeedbackPrompt(pending);
        })
        .catch((e) => {
          console.error(e);
        });
    }, [maybeOpenFeedbackPrompt, pendingFeedbackQuery, user?.id]),
  );

  const handleFeedbackSubmitted = useCallback(
    async ({ matchId } = {}) => {
      setFeedbackOpen(false);
      setActiveFeedback(null);

      try {
        if (Number.isFinite(Number(matchId))) {
          queryClient.setQueryData(pendingKey, (old) => {
            const oldPending = Array.isArray(old?.pending) ? old.pending : [];
            return {
              pending: oldPending.filter(
                (p) => Number(p?.matchId) !== Number(matchId),
              ),
            };
          });
        }
      } catch (e) {
        console.error(e);
      }

      try {
        const result = await pendingFeedbackQuery.refetch();
        const pending = result?.data?.pending || [];
        if (pending.length > 0) {
          setActiveFeedback(pending[0]);
          setFeedbackOpen(true);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [pendingFeedbackQuery, pendingKey, queryClient],
  );

  return {
    feedbackOpen,
    activeFeedback,
    handleFeedbackSubmitted,
  };
}
