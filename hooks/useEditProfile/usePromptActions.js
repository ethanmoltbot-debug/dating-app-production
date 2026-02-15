import { useCallback } from "react";

export function usePromptActions({
  setPrompts,
  setPromptPickerOpen,
  setPromptPickerIndex,
  promptPickerIndex,
  setVoicePrompt,
}) {
  const setPromptQuestion = useCallback(
    (question) => {
      setPrompts((prev) => {
        const next = [...prev];
        next[promptPickerIndex] = { ...next[promptPickerIndex], question };
        return next;
      });
      setPromptPickerOpen(false);
    },
    [promptPickerIndex, setPrompts, setPromptPickerOpen],
  );

  const setPromptAnswer = useCallback(
    (idx, answer) => {
      setPrompts((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], answer };
        return next;
      });
    },
    [setPrompts],
  );

  const openPromptPicker = useCallback(
    (idx) => {
      setPromptPickerIndex(idx);
      setPromptPickerOpen(true);
    },
    [setPromptPickerIndex, setPromptPickerOpen],
  );

  const selectVoiceQuestion = useCallback(() => {
    // Reuse the prompt list for now.
    setPromptPickerIndex(999); // sentinel for voice
    setPromptPickerOpen(true);
  }, [setPromptPickerIndex, setPromptPickerOpen]);

  const onPickPromptQuestion = useCallback(
    (question) => {
      if (promptPickerIndex === 999) {
        setVoicePrompt((prev) => ({ ...prev, question }));
        setPromptPickerOpen(false);
        return;
      }
      setPromptQuestion(question);
    },
    [promptPickerIndex, setPromptQuestion, setVoicePrompt, setPromptPickerOpen],
  );

  return {
    setPromptQuestion,
    setPromptAnswer,
    openPromptPicker,
    selectVoiceQuestion,
    onPickPromptQuestion,
  };
}
