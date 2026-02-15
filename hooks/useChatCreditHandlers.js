import { useCallback } from "react";

export function useChatCreditHandlers({
  setCreditModalOpen,
  setCreditModalIntent,
  pendingMoveAfterCommitRef,
  reloadMessages,
  handleMoveToChat,
}) {
  const onCreditModalClose = useCallback(() => {
    setCreditModalOpen(false);
    setCreditModalIntent(null);
    pendingMoveAfterCommitRef.current = false;
  }, [setCreditModalOpen, setCreditModalIntent, pendingMoveAfterCommitRef]);

  const onCreditModalCommitted = useCallback(
    async (creditModalIntent) => {
      const intent = creditModalIntent;
      setCreditModalOpen(false);
      setCreditModalIntent(null);

      try {
        await reloadMessages?.();
      } catch (e) {
        console.error(e);
      }

      if (intent === "move" && pendingMoveAfterCommitRef.current) {
        pendingMoveAfterCommitRef.current = false;
        setTimeout(() => {
          try {
            handleMoveToChat();
          } catch (e) {
            console.error(e);
          }
        }, 200);
      }
    },
    [
      setCreditModalOpen,
      setCreditModalIntent,
      reloadMessages,
      pendingMoveAfterCommitRef,
      handleMoveToChat,
    ],
  );

  return {
    onCreditModalClose,
    onCreditModalCommitted,
  };
}
