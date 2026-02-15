import { Modal, Pressable, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvailabilityPrompt } from "./AvailabilityPrompt";

export default function AvailabilityEditModal({
  visible,
  matchId,
  userId,
  onClose,
  title = "Update availability",
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
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
              {title}
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
              Pick up to 3 days. This updates what Wifey uses for overlap.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            <AvailabilityPrompt
              matchId={matchId}
              userId={userId}
              triggerSource="planDate"
              showSkip={false}
              showNotSure={false}
              ignoreDismissCooldown={true}
              forceShow={true}
              hydrateFromAvailability={true}
              onSaved={onClose}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
