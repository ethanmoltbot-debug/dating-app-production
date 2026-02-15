import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { X, RotateCcw } from "lucide-react-native";
import { AgeRangeFilter } from "./AgeRangeFilter";
import { DistanceFilter } from "./DistanceFilter";
import { GenderFilter } from "./GenderFilter";

export function FilterModal({
  visible,
  filters,
  onClose,
  onFiltersChange,
  onApply,
  onReset,
  bottomInset,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen" // iOS: required for transparent modals to reliably appear
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: bottomInset + 20,
            paddingHorizontal: 24,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#2D2D2D" }}>
              Filters
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#2D2D2D" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AgeRangeFilter
              minAge={filters.minAge}
              maxAge={filters.maxAge}
              onChange={(minAge, maxAge) =>
                onFiltersChange({ ...filters, minAge, maxAge })
              }
            />

            <DistanceFilter
              maxDistance={filters.maxDistance}
              onChange={(maxDistance) =>
                onFiltersChange({ ...filters, maxDistance })
              }
            />

            <GenderFilter
              gender={filters.gender}
              onChange={(gender) => onFiltersChange({ ...filters, gender })}
            />
          </ScrollView>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              onPress={onReset}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "#F5F5F5",
                paddingVertical: 16,
                borderRadius: 12,
              }}
            >
              <RotateCcw size={18} color="#2D2D2D" />
              <Text
                style={{ color: "#2D2D2D", fontSize: 16, fontWeight: "600" }}
              >
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onApply}
              style={{
                flex: 1,
                backgroundColor: "#FF1744",
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
