import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const ACCENT = "#FF1744";

const VISIBLE_ROWS = 5;
const ROW_HEIGHT = 36;
const PAD_Y = ((VISIBLE_ROWS - 1) / 2) * ROW_HEIGHT;
const PICKER_HEIGHT = VISIBLE_ROWS * ROW_HEIGHT;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function clampIndex(i, len) {
  const n = Number(i);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(len - 1, n));
}

function parseSelectedTime(selectedTime) {
  const v = String(selectedTime || "").trim();
  if (!v) return null;

  // Accept: 7:05 PM / 7 PM / 07:05pm
  const m = v
    .replace(/\s+/g, " ")
    .match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (!m) return null;

  const h = Number(m[1]);
  const minutes = typeof m[2] === "string" ? Number(m[2]) : 0;
  const ampm = String(m[3]).toUpperCase();

  if (h < 1 || h > 12) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (ampm !== "AM" && ampm !== "PM") return null;

  return { hour: h, minutes, ampm };
}

function defaultTimeFromOverlap(overlapTimes) {
  const t = Array.isArray(overlapTimes) ? overlapTimes : [];
  const lower = t.map((x) => String(x).toLowerCase());

  if (lower.includes("evening")) return { hour: 7, minutes: 0, ampm: "PM" };
  if (lower.includes("daytime")) return { hour: 12, minutes: 0, ampm: "PM" };
  if (lower.includes("late")) return { hour: 9, minutes: 0, ampm: "PM" };

  // Sensible default
  return { hour: 7, minutes: 0, ampm: "PM" };
}

function buildTimeLabel(hour, minutes, ampm) {
  const h = Number(hour);
  const m = Number(minutes);
  const ap = String(ampm || "").toUpperCase();
  if (!Number.isFinite(h) || h < 1 || h > 12) return "";
  if (!Number.isFinite(m) || m < 0 || m > 59) return "";
  if (ap !== "AM" && ap !== "PM") return "";

  return `${h}:${pad2(m)} ${ap}`;
}

function WheelColumn({ data, selectedIndex, onChangeIndex }) {
  const listRef = useRef(null);

  const safeIndex = clampIndex(selectedIndex, data.length);
  const initialOffset = safeIndex * ROW_HEIGHT;

  useEffect(() => {
    try {
      listRef.current?.scrollToOffset({
        offset: initialOffset,
        animated: true,
      });
    } catch {
      // no-op
    }
  }, [initialOffset]);

  const getItemLayout = useMemo(() => {
    return (_, index) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    });
  }, []);

  const onSnap = (e) => {
    const y = e?.nativeEvent?.contentOffset?.y || 0;
    const raw = Math.round(y / ROW_HEIGHT);
    const next = clampIndex(raw, data.length);
    onChangeIndex(next);
  };

  const centerTop = (PICKER_HEIGHT - ROW_HEIGHT) / 2;

  return (
    <View style={{ width: 86 }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: centerTop,
          height: ROW_HEIGHT,
          borderRadius: 10,
          backgroundColor: "#F3F4F6",
        }}
      />

      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => String(item)}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        nestedScrollEnabled
        snapToInterval={ROW_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onMomentumScrollEnd={onSnap}
        onScrollEndDrag={onSnap}
        getItemLayout={getItemLayout}
        contentContainerStyle={{
          paddingVertical: PAD_Y,
        }}
        style={{
          height: PICKER_HEIGHT,
        }}
        renderItem={({ item, index }) => {
          const active = index === safeIndex;
          const color = active ? "#111" : "#9CA3AF";
          const weight = active ? "900" : "700";

          return (
            <View
              style={{
                height: ROW_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: weight, color }}>
                {String(item)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

export default function TimePickerModal({
  visible,
  selectedTime,
  overlapTimes,
  onClose,
  onSelectTime,
}) {
  const hours = useMemo(() => {
    const out = [];
    for (let h = 1; h <= 12; h += 1) out.push(String(h));
    return out;
  }, []);

  const minutes = useMemo(() => {
    const out = [];
    for (let m = 0; m <= 59; m += 1) out.push(pad2(m));
    return out;
  }, []);

  const ampmOptions = useMemo(() => ["AM", "PM"], []);

  const initial = useMemo(() => {
    const parsed = parseSelectedTime(selectedTime);
    if (parsed) return parsed;
    return defaultTimeFromOverlap(overlapTimes);
  }, [overlapTimes, selectedTime]);

  const [hourIndex, setHourIndex] = useState(0);
  const [minuteIndex, setMinuteIndex] = useState(0);
  const [ampmIndex, setAmpmIndex] = useState(0);

  useEffect(() => {
    const hIdx = clampIndex(Number(initial.hour) - 1, hours.length);
    const mIdx = clampIndex(Number(initial.minutes), minutes.length);
    const aIdx = initial.ampm === "PM" ? 1 : 0;

    setHourIndex(hIdx);
    setMinuteIndex(mIdx);
    setAmpmIndex(aIdx);
  }, [hours.length, initial, minutes.length]);

  const chosen = useMemo(() => {
    const h = Number(hours[hourIndex]);
    const m = Number(minutes[minuteIndex]);
    const ap = ampmOptions[ampmIndex];
    return buildTimeLabel(h, m, ap);
  }, [ampmIndex, ampmOptions, hourIndex, hours, minuteIndex, minutes]);

  const onDone = useCallback(() => {
    if (!chosen) {
      onClose();
      return;
    }
    onSelectTime(chosen);
    onClose();
  }, [chosen, onClose, onSelectTime]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        {/* Backdrop is behind the picker, so it won't steal scroll gestures */}
        <Pressable
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
          pointerEvents="box-only"
        />

        <View
          style={{
            zIndex: 1,
            backgroundColor: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingTop: 12,
            paddingBottom: 18,
            borderWidth: 1,
            borderColor: "#E5E5E5",
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
              Pick a start time
            </Text>
            <TouchableOpacity
              onPress={onDone}
              style={{ paddingHorizontal: 10, paddingVertical: 8 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: ACCENT,
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <WheelColumn
              data={hours}
              selectedIndex={hourIndex}
              onChangeIndex={setHourIndex}
            />
            <WheelColumn
              data={minutes}
              selectedIndex={minuteIndex}
              onChangeIndex={setMinuteIndex}
            />
            <WheelColumn
              data={ampmOptions}
              selectedIndex={ampmIndex}
              onChangeIndex={setAmpmIndex}
            />
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              Selected:{" "}
              <Text style={{ fontWeight: "900", color: "#111" }}>{chosen}</Text>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
