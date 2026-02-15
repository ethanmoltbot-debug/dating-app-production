import { useCallback } from "react";

export function useInterestActions({
  interestDraft,
  setInterests,
  setInterestDraft,
}) {
  const addInterest = useCallback(() => {
    const trimmed = interestDraft.trim();
    if (!trimmed) return;
    setInterests((prev) => [...prev, trimmed]);
    setInterestDraft("");
  }, [interestDraft, setInterests, setInterestDraft]);

  const removeInterest = useCallback(
    (idx) => {
      setInterests((prev) => {
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
    },
    [setInterests],
  );

  return {
    addInterest,
    removeInterest,
  };
}
