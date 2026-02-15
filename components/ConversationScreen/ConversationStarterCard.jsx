import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

function titleCase(s) {
  const str = String(s || "");
  return str.length ? str[0].toUpperCase() + str.slice(1) : "";
}

function safeText(v) {
  if (v == null) return "";
  return String(v);
}

export default function ConversationStarterCard({ starter, viewerUserId }) {
  if (!starter) return null;

  const viewerId = Number(viewerUserId);
  const actorId = Number(starter?.actorUserId);
  const isMe =
    Number.isFinite(viewerId) && Number.isFinite(actorId)
      ? viewerId === actorId
      : false;

  const targetName = safeText(starter?.targetDisplayName).trim();
  const actorName = safeText(starter?.actorDisplayName).trim();

  const sectionType = safeText(starter?.sectionType).toLowerCase();
  const actionKind = safeText(starter?.actionKind).toLowerCase();

  const subject = isMe ? "You" : actorName || "They";

  const isComment = actionKind === "comment";
  const verb = isComment ? "commented on" : "liked";

  const sectionLabel =
    sectionType === "photo"
      ? "photo"
      : sectionType === "prompt"
        ? "prompt"
        : "profile";

  // If I did it, it was on the other person.
  // If they did it, it was on me.
  const ownerText = isMe ? (targetName ? `${targetName}'s` : "their") : "your";

  const titleLine = `${subject} ${verb} ${ownerText} ${sectionLabel}.`;

  const photoUrl = safeText(starter?.photoUrl).trim();
  const promptQ = safeText(starter?.promptQuestion).trim();
  const promptA = safeText(starter?.promptAnswer).trim();
  const commentText = safeText(starter?.commentText).trim();

  const showPhoto = Boolean(photoUrl);
  const showPrompt = Boolean(promptQ || promptA);

  const borderColor = isMe
    ? "rgba(255, 23, 68, 0.18)"
    : "rgba(17, 17, 17, 0.08)";

  // NEW: Make the starter photo look like it appears on a profile (smaller, square, card-like)
  const photoOuterPadding = 12;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.88)",
      }}
    >
      {showPhoto ? (
        <View style={{ padding: photoOuterPadding }}>
          <View
            style={{
              width: "100%",
              maxWidth: 340,
              alignSelf: "center",
              aspectRatio: 1,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: "#111",
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.10)",
            }}
          >
            <Image
              source={{ uri: photoUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
            />

            <LinearGradient
              colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.45)"]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 120,
              }}
            />

            {/* Title pill (matches the reference: small, readable, not full-bleed) */}
            <View
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: 12,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.90)",
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.10)",
                }}
              >
                <Text
                  style={{ color: "#111", fontSize: 13, fontWeight: "900" }}
                >
                  {titleLine}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {showPrompt ? (
        <View
          style={{
            padding: 14,
            paddingTop: showPhoto ? 2 : 14,
          }}
        >
          {!showPhoto ? (
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
              {titleLine}
            </Text>
          ) : null}

          {promptQ ? (
            <Text
              style={{
                marginTop: showPhoto ? 0 : 10,
                fontSize: 12,
                fontWeight: "800",
                color: "#6B7280",
              }}
            >
              {titleCase(promptQ)}
            </Text>
          ) : null}

          {promptA ? (
            <Text
              style={{
                marginTop: 6,
                fontSize: 16,
                fontWeight: "900",
                color: "#111",
                lineHeight: 22,
              }}
            >
              {promptA}
            </Text>
          ) : null}
        </View>
      ) : null}

      {!showPhoto && !showPrompt ? (
        <View style={{ padding: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
            {titleLine}
          </Text>
        </View>
      ) : null}

      {commentText ? (
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 14,
            paddingTop: showPhoto || showPrompt ? 0 : 10,
          }}
        >
          <View
            style={{
              borderRadius: 14,
              backgroundColor: "rgba(17,17,17,0.06)",
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "800" }}>
              Comment
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                color: "#111",
                lineHeight: 19,
                fontWeight: "700",
              }}
            >
              “{commentText}”
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
