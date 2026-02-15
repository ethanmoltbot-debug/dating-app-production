import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function SectionCommentModal({
  visible,
  profileName,
  sectionLabel,
  sectionMeta,
  onClose,
  onSubmit,
}) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");

  useEffect(() => {
    if (visible) {
      setText("");
    }
  }, [visible]);

  const title = useMemo(() => {
    const name = profileName || "this profile";
    return `Send to ${name}`;
  }, [profileName]);

  const subtitle = useMemo(() => {
    if (!sectionLabel) {
      return "";
    }
    return `About: ${sectionLabel}`;
  }, [sectionLabel]);

  const trimmed = useMemo(() => String(text || "").trim(), [text]);
  const hasText = trimmed.length > 0;

  const handlePrimarySend = useCallback(() => {
    // Like-only: send null. Comment: send trimmed.
    const payload = hasText ? trimmed : null;
    onSubmit(payload);
  }, [hasText, onSubmit, trimmed]);

  // Always keep a single "Send like" button (comment is optional).
  const primaryLabel = "Send like";

  const preview = useMemo(() => {
    const p = sectionMeta?.payload;
    const type = sectionMeta?.type;
    return { p, type };
  }, [sectionMeta?.payload, sectionMeta?.type]);

  const previewCard = useMemo(() => {
    const type = preview.type;
    const p = preview.p;

    if (!type) {
      return null;
    }

    const cardShell = (child) => (
      <View
        style={{
          backgroundColor: "#14151C",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#242733",
          overflow: "hidden",
        }}
      >
        {child}
      </View>
    );

    if (type === "photo") {
      const uri = typeof p?.uri === "string" ? p.uri : "";
      if (!uri) {
        return null;
      }

      return cardShell(
        <View>
          <Image
            source={{ uri }}
            style={{ width: "100%", height: 220 }}
            contentFit="cover"
            transition={100}
          />
        </View>,
      );
    }

    if (type === "video") {
      // Keep it simple: show a poster-style card instead of embedding video in the modal.
      const titleText = typeof p?.label === "string" ? p.label : "Video";
      return cardShell(
        <View style={{ padding: 14 }}>
          <Text style={{ color: "#A1A1AA", fontWeight: "800", fontSize: 12 }}>
            VIDEO
          </Text>
          <Text
            style={{
              marginTop: 10,
              color: "#F5F5F5",
              fontSize: 18,
              fontWeight: "900",
            }}
          >
            {titleText}
          </Text>
        </View>,
      );
    }

    if (type === "prompt") {
      const q = typeof p?.question === "string" ? p.question : "Prompt";
      const a = typeof p?.answer === "string" ? p.answer : "";

      return cardShell(
        <View style={{ padding: 14 }}>
          <Text
            style={{
              color: "#A1A1AA",
              fontWeight: "900",
              fontSize: 12,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {q}
          </Text>
          <Text
            style={{
              marginTop: 10,
              color: "#F5F5F5",
              fontSize: 18,
              fontWeight: "900",
              lineHeight: 24,
            }}
          >
            {a || "(No answer yet)"}
          </Text>
        </View>,
      );
    }

    if (type === "about") {
      const bio = typeof p?.bio === "string" ? p.bio : "";
      const location = typeof p?.location === "string" ? p.location : "";

      return cardShell(
        <View style={{ padding: 14 }}>
          <Text style={{ color: "#A1A1AA", fontWeight: "900", fontSize: 12 }}>
            ABOUT ME
          </Text>

          {location ? (
            <Text
              style={{ marginTop: 10, color: "#A1A1AA", fontWeight: "700" }}
            >
              {location}
            </Text>
          ) : null}

          <Text
            style={{
              marginTop: 10,
              color: bio ? "#F5F5F5" : "#A1A1AA",
              lineHeight: 20,
            }}
          >
            {bio || "(No bio yet)"}
          </Text>
        </View>,
      );
    }

    if (type === "basics") {
      const rows = Array.isArray(p?.rows) ? p.rows : [];
      const textRows = rows
        .map((r) => (typeof r === "string" ? r : ""))
        .filter((x) => x);

      return cardShell(
        <View style={{ padding: 14 }}>
          <Text style={{ color: "#A1A1AA", fontWeight: "900", fontSize: 12 }}>
            BASICS
          </Text>
          {textRows.length ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              {textRows.slice(0, 5).map((t, idx) => (
                <Text
                  key={`${t}-${idx}`}
                  style={{ color: "#F5F5F5", fontWeight: "800" }}
                >
                  {t}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={{ marginTop: 10, color: "#A1A1AA" }}>
              (No basics yet)
            </Text>
          )}
        </View>,
      );
    }

    if (type === "interests") {
      const tags = Array.isArray(p?.tags) ? p.tags : [];
      const clean = tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t);

      return cardShell(
        <View style={{ padding: 14 }}>
          <Text style={{ color: "#A1A1AA", fontWeight: "900", fontSize: 12 }}>
            INTERESTS
          </Text>
          {clean.length ? (
            <Text
              style={{
                marginTop: 10,
                color: "#F5F5F5",
                fontWeight: "800",
                lineHeight: 20,
              }}
            >
              {clean.slice(0, 10).join(" • ")}
            </Text>
          ) : (
            <Text style={{ marginTop: 10, color: "#A1A1AA" }}>
              (No interests yet)
            </Text>
          )}
        </View>,
      );
    }

    if (type === "voice") {
      const q = typeof p?.question === "string" ? p.question : "";
      const hasVoice = p?.hasVoice === true;
      return cardShell(
        <View style={{ padding: 14 }}>
          <Text style={{ color: "#A1A1AA", fontWeight: "900", fontSize: 12 }}>
            VOICE PROMPT
          </Text>
          {q ? (
            <Text
              style={{ marginTop: 10, color: "#F5F5F5", fontWeight: "800" }}
            >
              {q}
            </Text>
          ) : null}
          <Text style={{ marginTop: 10, color: "#A1A1AA" }}>
            {hasVoice ? "(Voice prompt attached)" : "(No voice prompt yet)"}
          </Text>
        </View>,
      );
    }

    return null;
  }, [preview.p, preview.type]);

  return (
    <Modal visible={!!visible} animationType="fade" transparent>
      <KeyboardAvoidingAnimatedView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1 }}>
          {/* Blur the whole underlying feed */}
          <BlurView
            intensity={70}
            tint="dark"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Tap outside = cancel */}
          <Pressable
            onPress={onClose}
            style={{
              flex: 1,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingHorizontal: 16,
              justifyContent: "flex-end",
            }}
          >
            {/* prevent bubbling taps from closing */}
            <Pressable onPress={() => {}}>
              {/* singled-out preview */}
              {previewCard ? (
                <View style={{ marginBottom: 12 }}>{previewCard}</View>
              ) : null}

              {/* composer */}
              <View
                style={{
                  backgroundColor: "#14151C",
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#242733",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "900", color: "#F5F5F5" }}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={{
                      marginTop: 6,
                      color: "#A1A1AA",
                      fontWeight: "700",
                    }}
                  >
                    {subtitle}
                  </Text>
                ) : null}

                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Add a comment (optional)…"
                  placeholderTextColor="#71717A"
                  multiline
                  style={{
                    marginTop: 12,
                    minHeight: 96,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#242733",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: "#F5F5F5",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    justifyContent: "flex-end",
                    marginTop: 14,
                  }}
                >
                  <TouchableOpacity
                    onPress={onClose}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.10)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.14)",
                    }}
                  >
                    <Text style={{ color: "#F5F5F5", fontWeight: "900" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePrimarySend}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      backgroundColor: "#FF1744",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>
                      {primaryLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </View>
      </KeyboardAvoidingAnimatedView>
    </Modal>
  );
}
