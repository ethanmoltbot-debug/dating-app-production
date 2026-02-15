import { Modal, Pressable, View, Text } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AvailabilityPrompt } from "./AvailabilityPrompt";

export default function AvailabilityModal({
  open,
  matchId,
  userId,
  triggerSource,
  onSaved,
  onSkipped,
  insets,
}) {
  const queryClient = useQueryClient();

  const skipMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch(`/api/matches/${matchId}/availability/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId) }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/matches/${matchId}/availability/skip, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matchAvailability", String(matchId), Number(userId)],
      });
      if (onSkipped) onSkipped();
    },
    onError: (e) => {
      console.error(e);
      if (onSkipped) onSkipped();
    },
  });

  const handleRequestClose = () => {
    // If the user dismisses the modal (back button), treat it as Skip.
    if (skipMutation.isPending) return;
    skipMutation.mutate();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleRequestClose}
    >
      <Pressable
        onPress={handleRequestClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#F5F5F5",
            paddingBottom: (insets?.bottom || 0) + 14,
            paddingTop: 10,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
              Wifey can help lock this in faster 🍸
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
              Pick up to 3 days. You can skip for now.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            <AvailabilityPrompt
              matchId={matchId}
              userId={userId}
              triggerSource={triggerSource}
              onSaved={onSaved}
              onSkipped={onSkipped}
              showSkip
              showNotSure={true} // ensure "Not sure yet" only exists on this chat-triggered modal
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
