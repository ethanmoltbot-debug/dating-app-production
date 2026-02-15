import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MapPin, ChevronRight, X } from "lucide-react-native";
import { Card } from "./Card";
import { Pill } from "./Pill";
import { formatDateLabel } from "@/utils/datePlannerHelpers";

const ACCENT = "#FF1744";

export function WhenWhereCard({
  hasPlan,
  showEditForm,
  lockedTitle,
  selectedDate,
  startTime,
  activityLabel,
  placeLabel,
  placeSecondary,
  placeSuggestions,
  activitySuggestions,
  onOpenCalendar,
  onOpenTime,
  onActivityLabelChange,
  onPlaceLabelChange,
  onOpenPlaceSearch,
  onClearPlace,
  onPropose,
  onCancelEdit,
  onEdit,
  isProposing,
  proposeDisabled,
  busy,
}) {
  const place = String(placeLabel || "").trim();
  const secondary = String(placeSecondary || "").trim();

  return (
    <Card>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
          When + where
        </Text>

        {hasPlan && !showEditForm ? (
          <TouchableOpacity
            onPress={onEdit}
            style={{ paddingHorizontal: 10, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 12, fontWeight: "900", color: ACCENT }}>
              Edit
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {hasPlan && !showEditForm ? (
        <View
          style={{
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#E5E5E5",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "900", color: "#111" }}>
            Current plan
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
            {lockedTitle}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 12, gap: 10 }}>
          <TouchableOpacity
            onPress={onOpenCalendar}
            activeOpacity={0.85}
            style={{
              borderWidth: 1,
              borderColor: "#E5E5E5",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: "#fff",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "800",
              }}
            >
              Date
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "900",
                color: "#111",
                marginTop: 6,
              }}
            >
              {formatDateLabel(selectedDate)}
            </Text>
          </TouchableOpacity>

          {/* Start time: selection only (no typing) */}
          <TouchableOpacity
            onPress={onOpenTime}
            activeOpacity={0.85}
            style={{
              borderWidth: 1,
              borderColor: "#E5E5E5",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: "#fff",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "800",
              }}
            >
              Start time
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "900",
                color: "#111",
                marginTop: 6,
              }}
            >
              {startTime ? String(startTime) : "Pick a time"}
            </Text>
          </TouchableOpacity>

          <View>
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "800",
              }}
            >
              Activity
            </Text>
            <TextInput
              value={activityLabel}
              onChangeText={onActivityLabelChange}
              placeholder="Drinks"
              placeholderTextColor="#9CA3AF"
              style={{
                marginTop: 6,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 14,
                color: "#111",
                backgroundColor: "#fff",
                fontWeight: "800",
              }}
            />

            {Array.isArray(activitySuggestions) &&
            activitySuggestions.length ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {activitySuggestions.map((s) => (
                  <Pill
                    key={s}
                    label={s}
                    active={activityLabel === s}
                    onPress={() => onActivityLabelChange(s)}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <View>
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "800",
              }}
            >
              Location
            </Text>

            <TouchableOpacity
              onPress={onOpenPlaceSearch}
              activeOpacity={0.85}
              style={{
                marginTop: 6,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <MapPin size={16} color="#6B7280" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "900",
                    color: place ? "#111" : "#9CA3AF",
                  }}
                  numberOfLines={1}
                >
                  {place || "Search a place"}
                </Text>
                {secondary ? (
                  <Text
                    style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {secondary}
                  </Text>
                ) : null}
              </View>

              {place ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onClearPlace();
                  }}
                  style={{ paddingHorizontal: 6, paddingVertical: 6 }}
                >
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ) : (
                <ChevronRight size={18} color="#9CA3AF" />
              )}
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
              }}
            >
              {placeSuggestions.map((s) => (
                <Pill
                  key={s}
                  label={s}
                  active={place === s}
                  onPress={() => onPlaceLabelChange(s)}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={onPropose}
            disabled={busy || proposeDisabled}
            style={{
              marginTop: 6,
              backgroundColor: ACCENT,
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: "center",
              opacity: busy || proposeDisabled ? 0.6 : 1,
            }}
          >
            {isProposing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "900",
                  color: "#fff",
                }}
              >
                {hasPlan ? "Send updated plan" : "Propose date"}
              </Text>
            )}
          </TouchableOpacity>

          {hasPlan && showEditForm ? (
            <TouchableOpacity
              onPress={onCancelEdit}
              style={{
                marginTop: 10,
                paddingVertical: 10,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                backgroundColor: "#fff",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: "#111",
                }}
              >
                Cancel editing
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </Card>
  );
}
