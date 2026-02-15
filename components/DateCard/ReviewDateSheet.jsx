import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { buildLockedTitle } from "@/utils/dateCardHelpers";

export function ReviewDateSheet({
  dateModel,
  proposedByMe,
  respondMutation,
  busy,
}) {
  const detailsLine = buildLockedTitle(
    dateModel?.dateStart,
    dateModel?.dateEnd,
    dateModel?.activityLabel,
    dateModel?.placeLabel,
  );

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E5E5",
          borderRadius: 14,
          padding: 12,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#2D2D2D" }}>
          {detailsLine}
        </Text>
        {proposedByMe ? (
          <Text style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
            Waiting on them to accept.
          </Text>
        ) : (
          <Text style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
            Accept to lock it in.
          </Text>
        )}
      </View>

      {!proposedByMe ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => respondMutation.mutate({ response: "decline" })}
            disabled={busy}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E5E5",
              alignItems: "center",
              backgroundColor: "#fff",
              opacity: busy ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: "#2D2D2D",
              }}
            >
              Decline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => respondMutation.mutate({ response: "accept" })}
            disabled={busy}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: "#FF1744",
              alignItems: "center",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>
                Accept
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
