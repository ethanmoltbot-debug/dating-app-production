import { Modal, Pressable, View, Text } from "react-native";
import { Calendar } from "react-native-calendars";

const ACCENT = "#FF1744";

export function CalendarModal({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: "#E5E5E5",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
            Pick a date
          </Text>

          <View style={{ marginTop: 10 }}>
            <Calendar
              onDayPress={(day) => {
                const dateString = day?.dateString;
                if (dateString) {
                  onSelectDate(dateString);
                }
                onClose();
              }}
              markedDates={
                selectedDate
                  ? {
                      [selectedDate]: {
                        selected: true,
                        selectedColor: ACCENT,
                      },
                    }
                  : {}
              }
              enableSwipeMonths
              theme={{
                todayTextColor: ACCENT,
                arrowColor: "#111",
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
