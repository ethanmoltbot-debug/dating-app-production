import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { daysInMonth } from "@/utils/birthdateHelpers";

const VISIBLE_ROWS = 5;
const ROW_HEIGHT = 36;
const PAD_Y = ((VISIBLE_ROWS - 1) / 2) * ROW_HEIGHT;
const PICKER_HEIGHT = VISIBLE_ROWS * ROW_HEIGHT;

function clampIndex(i, len) {
  const n = Number(i);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(len - 1, n));
}

function WheelColumn({ data, selectedIndex, onChangeIndex, width, openCount }) {
  const listRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const openSeqRef = useRef(0);
  const clearDragTimeoutRef = useRef(null);

  const safeIndex = clampIndex(selectedIndex, data.length);

  const getItemLayout = useMemo(() => {
    return (_, index) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    });
  }, []);

  // Auto-position the wheel when the sheet opens.
  // IMPORTANT: we only do the "settle" animation once per open, otherwise it fights the user's scroll.
  useEffect(() => {
    if (!openCount) return;
    if (openSeqRef.current === openCount) return;
    openSeqRef.current = openCount;

    const offset = safeIndex * ROW_HEIGHT;

    const raf = requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToOffset({ offset, animated: false });
      } catch {
        // no-op
      }
    });

    const id = setTimeout(() => {
      try {
        listRef.current?.scrollToOffset({ offset, animated: true });
      } catch {
        // no-op
      }
    }, 60);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(id);
    };
  }, [openCount, safeIndex]);

  // If something external changes the selected index (e.g. changing month clamps the day),
  // scroll to the new selection — but never while the user is actively scrolling this wheel.
  useEffect(() => {
    if (!openCount) return;
    if (isUserScrollingRef.current) return;
    const offset = safeIndex * ROW_HEIGHT;
    try {
      listRef.current?.scrollToOffset({ offset, animated: true });
    } catch {
      // no-op
    }
  }, [openCount, safeIndex, data.length]);

  const onSnap = useCallback(
    (e) => {
      const y = e?.nativeEvent?.contentOffset?.y || 0;
      const raw = Math.round(y / ROW_HEIGHT);
      const next = clampIndex(raw, data.length);
      onChangeIndex(next);
    },
    [data.length, onChangeIndex],
  );

  return (
    <View style={{ width }}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => String(item?.value ?? item)}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        nestedScrollEnabled
        snapToInterval={ROW_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isUserScrollingRef.current = true;
          if (clearDragTimeoutRef.current) {
            clearTimeout(clearDragTimeoutRef.current);
            clearDragTimeoutRef.current = null;
          }
        }}
        onMomentumScrollBegin={() => {
          isUserScrollingRef.current = true;
          if (clearDragTimeoutRef.current) {
            clearTimeout(clearDragTimeoutRef.current);
            clearDragTimeoutRef.current = null;
          }
        }}
        onScrollEndDrag={(e) => {
          onSnap(e);
          // If there is no momentum, we may never get onMomentumScrollEnd.
          // Clear the "user scrolling" flag shortly after the drag ends.
          clearDragTimeoutRef.current = setTimeout(() => {
            isUserScrollingRef.current = false;
            clearDragTimeoutRef.current = null;
          }, 140);
        }}
        onMomentumScrollEnd={(e) => {
          if (clearDragTimeoutRef.current) {
            clearTimeout(clearDragTimeoutRef.current);
            clearDragTimeoutRef.current = null;
          }
          // Keep the flag true while we update selection, so our effects don't fight the user's scroll.
          onSnap(e);
          isUserScrollingRef.current = false;
        }}
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingVertical: PAD_Y }}
        style={{ height: PICKER_HEIGHT }}
        renderItem={({ item, index }) => {
          const active = index === safeIndex;
          const label = String(item?.label ?? item);

          // Make the numbers always readable.
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
                {label}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

export function BirthdayPickerModal({
  visible,
  onCancel,
  onConfirm,
  draftYear,
  setDraftYear,
  draftMonth,
  setDraftMonth,
  draftDay,
  setDraftDay,
  insets,
}) {
  const YEAR_MIN = 1900;
  const YEAR_MAX = useMemo(() => new Date().getFullYear() - 18, []);
  const ACCENT = "#7C3AED";

  const [openCount, setOpenCount] = useState(0);
  useEffect(() => {
    if (visible) {
      setOpenCount((c) => c + 1);
    }
  }, [visible]);

  const monthOptions = useMemo(
    () => [
      { label: "Jan", value: 1 },
      { label: "Feb", value: 2 },
      { label: "Mar", value: 3 },
      { label: "Apr", value: 4 },
      { label: "May", value: 5 },
      { label: "Jun", value: 6 },
      { label: "Jul", value: 7 },
      { label: "Aug", value: 8 },
      { label: "Sep", value: 9 },
      { label: "Oct", value: 10 },
      { label: "Nov", value: 11 },
      { label: "Dec", value: 12 },
    ],
    [],
  );

  const yearOptions = useMemo(() => {
    const arr = [];
    for (let y = YEAR_MAX; y >= YEAR_MIN; y -= 1) {
      arr.push({ label: String(y), value: y });
    }
    return arr;
  }, [YEAR_MAX]);

  const dayOptions = useMemo(() => {
    const maxD = daysInMonth(draftYear, draftMonth);
    const arr = [];
    for (let d = 1; d <= maxD; d += 1) {
      arr.push({ label: String(d), value: d });
    }
    return arr;
  }, [draftMonth, draftYear]);

  const monthIndex = useMemo(() => {
    const idx = monthOptions.findIndex((m) => m.value === draftMonth);
    return idx >= 0 ? idx : 0;
  }, [draftMonth, monthOptions]);

  const dayIndex = useMemo(() => {
    const idx = dayOptions.findIndex((d) => d.value === draftDay);
    return idx >= 0 ? idx : 0;
  }, [dayOptions, draftDay]);

  const yearIndex = useMemo(() => {
    const idx = yearOptions.findIndex((y) => y.value === draftYear);
    return idx >= 0 ? idx : 0;
  }, [draftYear, yearOptions]);

  const setMonthByIndex = useCallback(
    (idx) => {
      const item = monthOptions[clampIndex(idx, monthOptions.length)];
      const nextMonth = Number(item?.value);
      if (!Number.isFinite(nextMonth)) return;
      const maxD = daysInMonth(draftYear, nextMonth);
      const safeDay = Math.min(draftDay, maxD);
      setDraftMonth(nextMonth);
      setDraftDay(safeDay);
    },
    [draftDay, draftYear, monthOptions, setDraftDay, setDraftMonth],
  );

  const setDayByIndex = useCallback(
    (idx) => {
      const item = dayOptions[clampIndex(idx, dayOptions.length)];
      const nextDay = Number(item?.value);
      if (!Number.isFinite(nextDay)) return;
      setDraftDay(nextDay);
    },
    [dayOptions, setDraftDay],
  );

  const setYearByIndex = useCallback(
    (idx) => {
      const item = yearOptions[clampIndex(idx, yearOptions.length)];
      const nextYear = Number(item?.value);
      if (!Number.isFinite(nextYear)) return;
      const maxD = daysInMonth(nextYear, draftMonth);
      const safeDay = Math.min(draftDay, maxD);
      setDraftYear(nextYear);
      setDraftDay(safeDay);
    },
    [draftDay, draftMonth, setDraftDay, setDraftYear, yearOptions],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        {/* Backdrop behind the sheet (won't steal scroll gestures) */}
        <Pressable
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
          pointerEvents="box-only"
        />

        <View
          style={{
            zIndex: 1,
            backgroundColor: "#fff",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingBottom: Math.max(16, insets.bottom + 10),
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.10)",
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 44,
              height: 5,
              borderRadius: 999,
              backgroundColor: "rgba(17,17,17,0.10)",
              marginTop: 10,
              marginBottom: 6,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 14,
              paddingTop: 10,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(17,17,17,0.08)",
            }}
          >
            <TouchableOpacity onPress={onCancel}>
              <Text style={{ color: "#6B7280", fontWeight: "900" }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text style={{ color: "#111", fontWeight: "900" }}>Birthday</Text>

            <TouchableOpacity onPress={onConfirm}>
              <Text style={{ color: ACCENT, fontWeight: "900" }}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Unified wheel area (single surface, readable text) */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 10,
              backgroundColor: "#fff",
            }}
          >
            <View
              style={{
                height: PICKER_HEIGHT,
                borderRadius: 16,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.08)",
                overflow: "hidden",
              }}
            >
              {/* one shared center highlight bar (feels like iOS) */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  top: (PICKER_HEIGHT - ROW_HEIGHT) / 2,
                  height: ROW_HEIGHT,
                  borderRadius: 12,
                  backgroundColor: "rgba(17,17,17,0.05)",
                  zIndex: 1,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 10,
                }}
              >
                <WheelColumn
                  data={monthOptions}
                  selectedIndex={monthIndex}
                  onChangeIndex={setMonthByIndex}
                  width={90}
                  openCount={openCount}
                />
                <WheelColumn
                  data={dayOptions}
                  selectedIndex={dayIndex}
                  onChangeIndex={setDayByIndex}
                  width={80}
                  openCount={openCount}
                />
                <WheelColumn
                  data={yearOptions}
                  selectedIndex={yearIndex}
                  onChangeIndex={setYearByIndex}
                  width={110}
                  openCount={openCount}
                />
              </View>
            </View>

            <Text
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              You must be 18+
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
