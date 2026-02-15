import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";

function formatTimeRange(dateStart, dateEnd) {
  try {
    if (!dateStart || !dateEnd) return null;
    const a = new Date(dateStart);
    const b = new Date(dateEnd);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;

    const dateLabel = a.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const startLabel = a.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const endLabel = b.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${dateLabel} • ${startLabel}–${endLabel}`;
  } catch {
    return null;
  }
}

export function DateInviteModal({
  open,
  onClose,
  invite,
  busy,
  onAccept,
  onDecline,
  onRequestChange,
  onChange,
  onCancelInvite,
  insets,
  viewerRole, // 'creator' | 'recipient'
}) {
  const date = invite?.date || null;
  const place = String(date?.placeLabel || "").trim();
  const activity = String(date?.activityLabel || "").trim();
  const timeLine = formatTimeRange(date?.dateStart, date?.dateEnd);

  const title =
    activity && place ? `${activity} @ ${place}` : place || activity;

  const isCreator = viewerRole === "creator";

  return (
    <Modal
      visible={Boolean(open)}
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
            backgroundColor: "#fff",
            paddingBottom: (insets?.bottom || 0) + 12,
            paddingTop: 10,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <View style={{ paddingHorizontal: 18, paddingVertical: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
              {isCreator ? "Your date invite" : "Date invite"}
            </Text>
            {title ? (
              <Text
                style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}
                numberOfLines={2}
              >
                {title}
              </Text>
            ) : null}
            {timeLine ? (
              <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                {timeLine}
              </Text>
            ) : null}
          </View>

          <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

          {isCreator ? (
            <>
              <TouchableOpacity
                onPress={onChange}
                disabled={busy}
                style={{ paddingHorizontal: 18, paddingVertical: 14 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#111",
                    fontWeight: "800",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  Change details
                </Text>
                <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
                  Edit the plan in the Date tab.
                </Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

              <TouchableOpacity
                onPress={onCancelInvite}
                disabled={busy}
                style={{ paddingHorizontal: 18, paddingVertical: 14 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#B00020",
                    fontWeight: "800",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  Cancel invite
                </Text>
                <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
                  Removes the proposal.
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={onAccept}
                disabled={busy}
                style={{ paddingHorizontal: 18, paddingVertical: 14 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#0A7A2F",
                    fontWeight: "800",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  Accept
                </Text>
                <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
                  Lock it in.
                </Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

              <TouchableOpacity
                onPress={onDecline}
                disabled={busy}
                style={{ paddingHorizontal: 18, paddingVertical: 14 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#B00020",
                    fontWeight: "800",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  Deny
                </Text>
                <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
                  Clears the plan.
                </Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

              <TouchableOpacity
                onPress={onRequestChange}
                disabled={busy}
                style={{ paddingHorizontal: 18, paddingVertical: 14 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#111",
                    fontWeight: "800",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  Request a change
                </Text>
                <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
                  Opens the Date tab so you can send an updated plan.
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 1, backgroundColor: "#EFEFEF" }} />

          <TouchableOpacity
            onPress={onClose}
            disabled={busy}
            style={{ paddingHorizontal: 18, paddingVertical: 14 }}
          >
            <Text
              style={{
                fontSize: 16,
                color: "#2D2D2D",
                fontWeight: "700",
                opacity: busy ? 0.6 : 1,
              }}
            >
              Close
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
