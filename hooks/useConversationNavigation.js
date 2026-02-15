import { useEffect } from "react";

export function useConversationNavigation(navigation, router) {
  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      const actionType = e?.data?.action?.type;
      const isBack = actionType === "GO_BACK" || actionType === "POP";
      if (!isBack) return;

      e.preventDefault();
      try {
        router.replace("/messages");
      } catch (err) {
        console.error(err);
      }
    });

    return unsub;
  }, [navigation, router]);
}
