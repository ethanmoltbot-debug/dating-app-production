import { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import {
  X,
  Camera,
  Download,
  Share2,
  Copy,
  ChevronRight,
} from "lucide-react-native";

function ActionButton({ icon: Icon, label, onPress, tint, bg }) {
  const backgroundColor = bg || "rgba(17, 17, 17, 0.06)";
  const color = tint || "#111";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: "48%" }}
    >
      <View
        style={{
          borderRadius: 18,
          paddingVertical: 16,
          paddingHorizontal: 14,
          backgroundColor,
          borderWidth: 1,
          borderColor: "rgba(17, 17, 17, 0.08)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.9)",
              borderWidth: 1,
              borderColor: "rgba(17, 17, 17, 0.08)",
            }}
          >
            <Icon size={20} color={color} />
          </View>
          <Text
            style={{
              flex: 1,
              color: "#111",
              fontWeight: "900",
              fontSize: 14,
            }}
          >
            {label}
          </Text>
          <ChevronRight size={18} color="rgba(17,17,17,0.45)" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ShareCardSheet({
  visible,
  onClose,
  onSaveImage,
  onShareInstagramStory,
  onShareMore,
  onCopyLink,
  disabled,
}) {
  const subtitle = useMemo(() => {
    if (disabled) {
      return "Preparing your share card…";
    }

    if (Platform.OS === "ios") {
      return "Save image opens your iPhone share sheet — tap “Save Image”. (On simulators this option may not appear.)";
    }

    return "Save image opens your system share sheet.";
  }, [disabled]);

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          padding: 16,
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "rgba(255,255,255,0.96)",
            borderRadius: 26,
            borderWidth: 1,
            borderColor: "rgba(17, 17, 17, 0.08)",
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              Share
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(17, 17, 17, 0.06)",
                borderWidth: 1,
                borderColor: "rgba(17, 17, 17, 0.08)",
              }}
            >
              <X size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 12,
              color: "rgba(17,17,17,0.55)",
              lineHeight: 16,
              marginBottom: 14,
            }}
          >
            {subtitle}
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <ActionButton
              icon={Camera}
              label="Instagram Story"
              onPress={onShareInstagramStory}
              tint="#E1306C"
              bg="rgba(225, 48, 108, 0.08)"
            />
            <ActionButton
              icon={Download}
              label="Save image"
              onPress={onSaveImage}
              tint="#111"
              bg="rgba(17, 17, 17, 0.06)"
            />
            {onCopyLink ? (
              <ActionButton
                icon={Copy}
                label="Copy link"
                onPress={onCopyLink}
                tint="#111"
                bg="rgba(17, 17, 17, 0.06)"
              />
            ) : null}
            <ActionButton
              icon={Share2}
              label="More"
              onPress={onShareMore}
              tint="#111"
              bg="rgba(17, 17, 17, 0.06)"
            />
          </View>

          {disabled ? null : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
