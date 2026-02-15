import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Section } from "./Section";
import LocationAutocompleteInput from "@/components/LocationAutocompleteInput";
import { formatCategoryWithEmoji } from "@/utils/categoryEmojis";
import { useQuery } from "@tanstack/react-query";

const ACCENT = "#7C3AED";
const ROW_HEIGHT = 44;

function formatGender(value) {
  if (value === "female") return "Woman";
  if (value === "male") return "Man";
  if (value === "non-binary") return "Non-binary";
  if (value === "other") return "Other";
  return "";
}

function parseHeight(heightRaw) {
  const raw = String(heightRaw || "").trim();
  if (!raw) {
    return { unit: "imperial", feet: 5, inches: 8, cm: 173 };
  }

  const lower = raw.toLowerCase();
  const cmMatch = lower.match(/(\d{2,3})\s*cm/);
  if (cmMatch && cmMatch[1]) {
    const cm = Number(cmMatch[1]);
    if (Number.isFinite(cm)) {
      const totalIn = cm / 2.54;
      const feet = Math.floor(totalIn / 12);
      const inches = Math.round(totalIn - feet * 12);
      return {
        unit: "metric",
        cm,
        feet: Math.max(3, Math.min(8, feet)),
        inches: Math.max(0, Math.min(11, inches)),
      };
    }
  }

  // Accept: 5'8", 5’8, 5 ft 8 in, 5ft 8in
  const impMatch = lower.match(/(\d)\s*(?:ft|')\s*(\d{1,2})?/);
  if (impMatch && impMatch[1]) {
    const feet = Number(impMatch[1]);
    const inches = impMatch[2] ? Number(impMatch[2]) : 0;
    const safeFeet = Number.isFinite(feet) ? feet : 5;
    const safeIn = Number.isFinite(inches) ? inches : 0;
    const cm = Math.round((safeFeet * 12 + safeIn) * 2.54);
    return {
      unit: "imperial",
      feet: Math.max(3, Math.min(8, safeFeet)),
      inches: Math.max(0, Math.min(11, safeIn)),
      cm,
    };
  }

  // Fallback: keep imperial default
  return { unit: "imperial", feet: 5, inches: 8, cm: 173 };
}

function formatHeight({ unit, feet, inches, cm }) {
  if (unit === "metric") {
    const safe = Number(cm);
    if (!Number.isFinite(safe)) return "";
    return `${safe} cm`;
  }

  const f = Number(feet);
  const i = Number(inches);
  if (!Number.isFinite(f) || !Number.isFinite(i)) return "";
  return `${f}'${i}"`;
}

function FieldRow({ label, value, placeholder, onPress, isLast }) {
  const hasValue = !!String(value || "").trim();
  const rightText = hasValue ? String(value) : placeholder;
  const rightColor = hasValue ? "#111" : "#9CA3AF";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        height: ROW_HEIGHT,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#E5E5EA",
      }}
    >
      <Text style={{ fontSize: 16, color: "#111", fontWeight: "600" }}>
        {label}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            color: rightColor,
            fontWeight: "600",
            maxWidth: 190,
          }}
          numberOfLines={1}
        >
          {rightText}
        </Text>
        <ChevronRight size={18} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

function Sheet({
  visible,
  title,
  onClose,
  onDone,
  children,
  doneDisabled,
  scrollable,
}) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            zIndex: 0,
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            overflow: "hidden",
            maxHeight: "78%", // prevents the sheet from becoming full-screen & trapping taps
            zIndex: 1,
          }}
        >
          <View
            style={{
              paddingTop: 10,
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#E5E5EA",
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 44,
                height: 5,
                borderRadius: 999,
                backgroundColor: "#E5E5EA",
                marginBottom: 10,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 10,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{ paddingVertical: 6, paddingHorizontal: 4 }}
              >
                <Text style={{ color: "#111", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>

              <Text style={{ color: "#111", fontSize: 16, fontWeight: "800" }}>
                {title}
              </Text>

              <TouchableOpacity
                disabled={doneDisabled}
                onPress={onDone}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: doneDisabled ? "#F3F4F6" : ACCENT,
                }}
              >
                <Text
                  style={{
                    color: doneDisabled ? "#9CA3AF" : "#fff",
                    fontWeight: "800",
                  }}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ padding: 14 }}>{children}</View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function WheelColumn({ values, selectedIndex, onSelectIndex, width = 120 }) {
  const ref = useRef(null);

  useEffect(() => {
    try {
      const y = Math.max(0, selectedIndex) * ROW_HEIGHT;
      ref.current?.scrollTo({ y, animated: false });
    } catch {
      // ignore
    }
  }, [selectedIndex]);

  const onMomentumScrollEnd = useCallback(
    (e) => {
      const y = e?.nativeEvent?.contentOffset?.y || 0;
      const idx = Math.round(y / ROW_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      onSelectIndex(clamped);
    },
    [onSelectIndex, values.length],
  );

  return (
    <View style={{ width, height: ROW_HEIGHT * 5, overflow: "hidden" }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={{ paddingVertical: ROW_HEIGHT * 2 }}
      >
        {values.map((v) => (
          <View
            key={String(v)}
            style={{
              height: ROW_HEIGHT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#111" }}>
              {String(v)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* selection window */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ROW_HEIGHT * 2,
          height: ROW_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: "#E5E5EA",
          backgroundColor: "rgba(255,255,255,0.01)",
        }}
      />
    </View>
  );
}

export function BasicsSection({
  age,
  gender,
  location,
  phoneNumber,
  category,
  height,
  jobTitle,
  company,
  education,
  lookingFor,
  sexuality,
  onChangeAge,
  onChangeGender,
  onChangeLocation,
  onChangePhoneNumber,
  onChangeCategory,
  onChangeHeight,
  onChangeJobTitle,
  onChangeCompany,
  onChangeEducation,
  onChangeLookingFor,
  onChangeSexuality,
}) {
  const genderOptions = useMemo(
    () => [
      { label: "Woman", value: "female" },
      { label: "Man", value: "male" },
      { label: "Non-binary", value: "non-binary" },
      { label: "Other", value: "other" },
    ],
    [],
  );

  const defaultCategoryOptions = useMemo(
    () => [
      "Gym",
      "Rock Climber",
      "Artist",
      "Biker",
      "Traveler",
      "Foodie",
      "Reader",
      "Gamer",
      "Runner",
      "Yoga",
      "Skier",
      "Surfer",
      "Musician",
      "Dog Mom",
      "Coffee",
    ],
    [],
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const resp = await fetch("/api/categories");
      if (!resp.ok) {
        throw new Error(
          `When fetching /api/categories, the response was [${resp.status}] ${resp.statusText}`,
        );
      }
      return resp.json();
    },
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });

  const categoryOptions = useMemo(() => {
    const list = Array.isArray(categoriesQuery.data?.categories)
      ? categoriesQuery.data.categories
      : null;

    if (list && list.length) {
      const names = list
        .map((c) => String(c?.name || "").trim())
        .filter(Boolean);
      if (names.length) return names;
    }

    return defaultCategoryOptions;
  }, [categoriesQuery.data, defaultCategoryOptions]);

  const sexualityOptions = useMemo(
    () => [
      "Straight",
      "Gay",
      "Lesbian",
      "Bisexual",
      "Pansexual",
      "Asexual",
      "Queer",
      "Questioning",
      "Other",
    ],
    [],
  );

  const [sheet, setSheet] = useState(null); // 'age' | 'location' | 'phone' | 'gender' | 'height' | 'jobTitle' | 'company' | 'education' | 'lookingFor' | 'sexuality'
  const [draft, setDraft] = useState("");

  const heightParsed = useMemo(() => parseHeight(height), [height]);
  const [heightUnit, setHeightUnit] = useState(heightParsed.unit);
  const [heightFeet, setHeightFeet] = useState(heightParsed.feet);
  const [heightInches, setHeightInches] = useState(heightParsed.inches);
  const [heightCm, setHeightCm] = useState(heightParsed.cm);

  useEffect(() => {
    // keep picker state in sync if height changes externally
    setHeightUnit(heightParsed.unit);
    setHeightFeet(heightParsed.feet);
    setHeightInches(heightParsed.inches);
    setHeightCm(heightParsed.cm);
  }, [
    heightParsed.cm,
    heightParsed.feet,
    heightParsed.inches,
    heightParsed.unit,
  ]);

  const openTextSheet = useCallback((type, current) => {
    setDraft(String(current || ""));
    setSheet(type);
  }, []);

  const openHeightSheet = useCallback(() => {
    setSheet("height");
  }, []);

  const openGenderSheet = useCallback(() => {
    setSheet("gender");
  }, []);

  const closeSheet = useCallback(() => {
    setSheet(null);
  }, []);

  const onDoneText = useCallback(() => {
    const trimmed = String(draft || "").trim();
    if (sheet === "age") {
      onChangeAge(trimmed);
    } else if (sheet === "location") {
      onChangeLocation(trimmed);
    } else if (sheet === "phone") {
      onChangePhoneNumber(trimmed);
    } else if (sheet === "jobTitle") {
      onChangeJobTitle(trimmed);
    } else if (sheet === "company") {
      onChangeCompany(trimmed);
    } else if (sheet === "education") {
      onChangeEducation(trimmed);
    } else if (sheet === "lookingFor") {
      onChangeLookingFor(trimmed);
    }
    closeSheet();
  }, [
    closeSheet,
    draft,
    onChangeAge,
    onChangeCompany,
    onChangeEducation,
    onChangeJobTitle,
    onChangeLocation,
    onChangeLookingFor,
    onChangePhoneNumber,
    sheet,
  ]);

  const onDoneHeight = useCallback(() => {
    const next = formatHeight({
      unit: heightUnit,
      feet: heightFeet,
      inches: heightInches,
      cm: heightCm,
    });
    onChangeHeight(next);
    closeSheet();
  }, [
    closeSheet,
    heightCm,
    heightFeet,
    heightInches,
    heightUnit,
    onChangeHeight,
  ]);

  const categoryDisplay = useMemo(() => {
    const trimmed = String(category || "").trim();
    return trimmed ? trimmed : "";
  }, [category]);

  const ageDisplay = useMemo(() => {
    const trimmed = String(age || "").trim();
    return trimmed ? trimmed : "";
  }, [age]);

  const genderDisplay = useMemo(() => {
    const g = formatGender(String(gender || "").trim());
    return g;
  }, [gender]);

  const heightDisplay = useMemo(() => {
    const trimmed = String(height || "").trim();
    return trimmed ? trimmed : "";
  }, [height]);

  const sexualityDisplay = useMemo(() => {
    const trimmed = String(sexuality || "").trim();
    return trimmed ? trimmed : "";
  }, [sexuality]);

  const feetValues = useMemo(() => [3, 4, 5, 6, 7, 8], []);
  const inchValues = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], []);
  const cmValues = useMemo(() => {
    const arr = [];
    for (let i = 140; i <= 210; i += 1) arr.push(i);
    return arr;
  }, []);

  const feetIndex = useMemo(() => {
    const idx = feetValues.indexOf(heightFeet);
    return idx >= 0 ? idx : 2;
  }, [feetValues, heightFeet]);

  const inchIndex = useMemo(() => {
    const idx = inchValues.indexOf(heightInches);
    return idx >= 0 ? idx : 0;
  }, [heightInches, inchValues]);

  const cmIndex = useMemo(() => {
    const idx = cmValues.indexOf(heightCm);
    return idx >= 0 ? idx : 33;
  }, [cmValues, heightCm]);

  const textKeyboardType = sheet === "age" ? "number-pad" : "default";
  const textTitle = useMemo(() => {
    if (sheet === "age") return "Age";
    if (sheet === "location") return "Location";
    if (sheet === "phone") return "Phone";
    if (sheet === "jobTitle") return "Job title";
    if (sheet === "company") return "Company";
    if (sheet === "education") return "Education";
    if (sheet === "lookingFor") return "Looking for";
    return "";
  }, [sheet]);

  const onSelectLocationSuggestion = useCallback(
    (s) => {
      const label = String(s?.label || "").trim();
      if (!label) return;
      setDraft(label);
      onChangeLocation(label);
      closeSheet();
    },
    [closeSheet, onChangeLocation],
  );

  return (
    <Section
      title="Basics"
      subtitle="Only answered items show up on your profile."
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#E5E5EA",
          overflow: "hidden",
        }}
      >
        <FieldRow
          label="Age"
          value={ageDisplay}
          placeholder="Add"
          onPress={() => openTextSheet("age", age)}
        />
        <FieldRow
          label="Location"
          value={location}
          placeholder="Add"
          onPress={() => openTextSheet("location", location)}
        />
        <FieldRow
          label="Gender"
          value={genderDisplay}
          placeholder="Add"
          onPress={openGenderSheet}
        />
        <FieldRow
          label="Category"
          value={categoryDisplay}
          placeholder="Pick one"
          onPress={() => setSheet("category")}
        />
        <FieldRow
          label="Sexuality"
          value={sexualityDisplay}
          placeholder="Add"
          onPress={() => setSheet("sexuality")}
        />
        <FieldRow
          label="Height"
          value={heightDisplay}
          placeholder="Add"
          onPress={openHeightSheet}
        />
        <FieldRow
          label="Phone"
          value={phoneNumber}
          placeholder="Add"
          onPress={() => openTextSheet("phone", phoneNumber)}
        />
        <FieldRow
          label="Looking for"
          value={lookingFor}
          placeholder="Add"
          onPress={() => openTextSheet("lookingFor", lookingFor)}
        />
        <FieldRow
          label="Job title"
          value={jobTitle}
          placeholder="Add"
          onPress={() => openTextSheet("jobTitle", jobTitle)}
        />
        <FieldRow
          label="Company"
          value={company}
          placeholder="Add"
          onPress={() => openTextSheet("company", company)}
        />
        <FieldRow
          label="Education"
          value={education}
          placeholder="Add"
          onPress={() => openTextSheet("education", education)}
          isLast
        />
      </View>

      {/* Text editor sheet */}
      <Sheet
        visible={
          !!sheet &&
          sheet !== "height" &&
          sheet !== "gender" &&
          sheet !== "category" &&
          sheet !== "sexuality" &&
          sheet !== "location"
        }
        title={textTitle}
        onClose={closeSheet}
        onDone={onDoneText}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add"
          placeholderTextColor="#9CA3AF"
          keyboardType={textKeyboardType}
          autoFocus
          style={{
            backgroundColor: "#F2F2F7",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 16,
            color: "#111",
          }}
        />
      </Sheet>

      {/* Location sheet (autocomplete) */}
      <Sheet
        visible={sheet === "location"}
        title="Location"
        onClose={closeSheet}
        onDone={onDoneText}
        doneDisabled={false}
        scrollable
      >
        <View>
          <Text style={{ color: "#6B7280", fontSize: 12, marginBottom: 10 }}>
            Start typing your city, then pick a match.
          </Text>

          <LocationAutocompleteInput
            value={draft}
            onChangeText={setDraft}
            autoFocus
            types="(cities)"
            maxHeight={260}
            accent={ACCENT}
            placeholder="City, State"
            onSelectSuggestion={onSelectLocationSuggestion}
          />

          <Text
            style={{
              marginTop: 10,
              color: "#6B7280",
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            Tip: You can also just type your location and tap Done.
          </Text>
        </View>
      </Sheet>

      {/* Gender sheet */}
      <Sheet
        visible={sheet === "gender"}
        title="Gender"
        onClose={closeSheet}
        onDone={closeSheet}
        scrollable
      >
        <View style={{ gap: 10 }}>
          {genderOptions.map((opt) => {
            const selected = gender === opt.value;
            const bg = selected ? "#F3E8FF" : "#F2F2F7";
            const border = selected ? "#D8B4FE" : "#E5E5EA";
            const color = selected ? ACCENT : "#111";

            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.85}
                onPress={() => {
                  onChangeGender(opt.value);
                  closeSheet();
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <Text style={{ color, fontSize: 16, fontWeight: "800" }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => {
              onChangeGender("");
              closeSheet();
            }}
            style={{ paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>Clear</Text>
          </TouchableOpacity>
        </View>
      </Sheet>

      {/* Category sheet */}
      <Sheet
        visible={sheet === "category"}
        title="Category"
        onClose={closeSheet}
        onDone={closeSheet}
        scrollable
      >
        <View style={{ gap: 10 }}>
          {categoryOptions.map((opt) => {
            const selected = String(category || "").trim() === opt;
            const bg = selected ? "#F3E8FF" : "#F2F2F7";
            const border = selected ? "#D8B4FE" : "#E5E5EA";
            const color = selected ? ACCENT : "#111";
            const label = formatCategoryWithEmoji(opt);

            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.85}
                onPress={() => {
                  onChangeCategory(opt);
                  closeSheet();
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <Text style={{ color, fontSize: 16, fontWeight: "800" }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => {
              onChangeCategory("");
              closeSheet();
            }}
            style={{ paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>Clear</Text>
          </TouchableOpacity>
        </View>
      </Sheet>

      {/* Sexuality sheet */}
      <Sheet
        visible={sheet === "sexuality"}
        title="Sexuality"
        onClose={closeSheet}
        onDone={closeSheet}
        scrollable
      >
        <View style={{ gap: 10 }}>
          {sexualityOptions.map((opt) => {
            const selected = String(sexuality || "") === opt;
            const bg = selected ? "#F3E8FF" : "#F2F2F7";
            const border = selected ? "#D8B4FE" : "#E5E5EA";
            const color = selected ? ACCENT : "#111";

            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.85}
                onPress={() => {
                  onChangeSexuality(opt);
                  closeSheet();
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <Text style={{ color, fontSize: 16, fontWeight: "800" }}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => {
              onChangeSexuality("");
              closeSheet();
            }}
            style={{ paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>Clear</Text>
          </TouchableOpacity>
        </View>
      </Sheet>

      {/* Height wheel sheet */}
      <Sheet
        visible={sheet === "height"}
        title="Height"
        onClose={closeSheet}
        onDone={onDoneHeight}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <View
            style={{
              backgroundColor: "#F2F2F7",
              borderRadius: 12,
              padding: 2,
              flexDirection: "row",
              width: 220,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setHeightUnit("imperial")}
              style={{
                flex: 1,
                borderRadius: 10,
                paddingVertical: 8,
                alignItems: "center",
                backgroundColor:
                  heightUnit === "imperial" ? "#fff" : "transparent",
              }}
            >
              <Text style={{ color: "#111", fontWeight: "800" }}>ft / in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setHeightUnit("metric")}
              style={{
                flex: 1,
                borderRadius: 10,
                paddingVertical: 8,
                alignItems: "center",
                backgroundColor:
                  heightUnit === "metric" ? "#fff" : "transparent",
              }}
            >
              <Text style={{ color: "#111", fontWeight: "800" }}>cm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {heightUnit === "metric" ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
            }}
          >
            <WheelColumn
              values={cmValues}
              selectedIndex={cmIndex}
              onSelectIndex={(idx) => setHeightCm(cmValues[idx])}
              width={140}
            />
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#6B7280" }}>
              cm
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
            }}
          >
            <WheelColumn
              values={feetValues}
              selectedIndex={feetIndex}
              onSelectIndex={(idx) => setHeightFeet(feetValues[idx])}
              width={120}
            />
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#6B7280" }}>
              ft
            </Text>

            <WheelColumn
              values={inchValues}
              selectedIndex={inchIndex}
              onSelectIndex={(idx) => setHeightInches(inchValues[idx])}
              width={120}
            />
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#6B7280" }}>
              in
            </Text>
          </View>
        )}

        <Text style={{ marginTop: 14, color: "#6B7280", textAlign: "center" }}>
          Scroll to pick your height.
        </Text>

        <TouchableOpacity
          onPress={() => {
            onChangeHeight("");
            closeSheet();
          }}
          style={{ marginTop: 12, paddingVertical: 10, alignItems: "center" }}
        >
          <Text style={{ color: "#6B7280", fontWeight: "700" }}>
            Clear height
          </Text>
        </TouchableOpacity>
      </Sheet>
    </Section>
  );
}
