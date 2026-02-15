import { useCallback } from "react";
import { Alert } from "react-native";

export function useUnmatchHandler(unmatch, setUnmatchOpen) {
  const onPickUnmatchReason = useCallback(
    (reasonCode) => {
      setUnmatchOpen(false);

      Alert.alert(
        "Unmatch?",
        "This will remove the match and delete the chat.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unmatch",
            style: "destructive",
            onPress: async () => {
              await unmatch({ reasonCode });
            },
          },
        ],
      );
    },
    [unmatch, setUnmatchOpen],
  );

  return { onPickUnmatchReason };
}
