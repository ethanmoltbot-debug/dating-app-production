import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useConversationStarter } from "@/hooks/useConversationStarter";

function firstPhotoUrlFromPhotos(photos) {
  if (Array.isArray(photos) && photos.length > 0) {
    const url = photos[0];
    return typeof url === "string" && url.length ? url : null;
  }

  if (typeof photos === "string") {
    try {
      const parsed = JSON.parse(photos);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const url = parsed[0];
        return typeof url === "string" && url.length ? url : null;
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

export function MatchModal({
  visible,
  matchedUser,
  matchId,
  currentUserId,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const starterRes = useConversationStarter(matchId, currentUserId);
  const starter = starterRes.starter;

  const starterSummary = useMemo(() => {
    if (!starter) return null;
    const viewerId = Number(currentUserId);
    const actorId = Number(starter?.actorUserId);
    const isMe =
      Number.isFinite(viewerId) && Number.isFinite(actorId)
        ? viewerId === actorId
        : false;

    const actorName = String(starter?.actorDisplayName || "").trim();
    const targetName = String(starter?.targetDisplayName || "").trim();
    const subject = isMe ? "You" : actorName || "They";

    const sectionType = String(starter?.sectionType || "").toLowerCase();
    const actionKind = String(starter?.actionKind || "").toLowerCase();
    const isComment = actionKind === "comment";
    const verb = isComment ? "commented on" : "liked";

    const sectionLabel =
      sectionType === "photo"
        ? "photo"
        : sectionType === "prompt"
          ? "prompt"
          : "profile";

    const ownerText = isMe
      ? targetName
        ? `${targetName}'s`
        : "their"
      : "your";

    return `${subject} ${verb} ${ownerText} ${sectionLabel}.`;
  }, [currentUserId, starter]);

  const displayName = matchedUser?.display_name || "";

  const startChatLine = useMemo(() => {
    const safeName = String(displayName || "").trim();
    const namePart = safeName.length ? safeName : "your match";
    return `start the chat with ${namePart}`;
  }, [displayName]);

  const [myPhotoUrl, setMyPhotoUrl] = useState(null);
  const [loadingMyPhoto, setLoadingMyPhoto] = useState(false);
  const [sendingHello, setSendingHello] = useState(false);
  const [error, setError] = useState(null);

  // NOTE: keep all hooks above any early return.
  useEffect(() => {
    let cancelled = false;

    const loadMyProfile = async () => {
      try {
        setError(null);

        if (!visible) return;
        if (!currentUserId) return;

        setLoadingMyPhoto(true);

        const resp = await fetch(`/api/profile/me?userId=${currentUserId}`);
        if (!resp.ok) {
          throw new Error(
            `When fetching /api/profile/me, the response was [${resp.status}] ${resp.statusText}`,
          );
        }

        const data = await resp.json();
        const profile = data?.profile;
        const nextUrl = firstPhotoUrlFromPhotos(profile?.photos);

        if (!cancelled) {
          setMyPhotoUrl(nextUrl);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setMyPhotoUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingMyPhoto(false);
        }
      }
    };

    loadMyProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, visible]);

  const otherPhotoUrl = firstPhotoUrlFromPhotos(matchedUser?.photos);

  const goToMessages = () => {
    try {
      if (!matchId) {
        onClose?.();
        return;
      }
      onClose?.();
      // IMPORTANT: route groups like (tabs) are not part of the URL
      router.push(`/messages/${String(matchId)}`);
    } catch (e) {
      console.error(e);
      onClose?.();
    }
  };

  const sayHello = async () => {
    try {
      setError(null);

      if (!matchId || !currentUserId) {
        goToMessages();
        return;
      }

      if (sendingHello) {
        return;
      }

      setSendingHello(true);

      const resp = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          senderId: currentUserId,
          messageText: "Hey 👋",
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `When fetching /api/messages/send, the response was [${resp.status}] ${resp.statusText} ${text}`,
        );
      }

      goToMessages();
    } catch (e) {
      console.error(e);
      setError("Could not send your hello. Try again.");
    } finally {
      setSendingHello(false);
    }
  };

  const show = Boolean(visible && matchedUser);
  if (!show) return null;

  const avatarSize = 124;
  const overlap = 28;

  return (
    <Modal visible={show} transparent animationType="fade">
      <Pressable
        onPress={() => {
          onClose?.();
        }}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={["rgba(255, 79, 216, 0.96)", "rgba(124, 58, 237, 0.96)"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            flex: 1,
            paddingTop: insets.top + 22,
            paddingBottom: insets.bottom + 22,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Stop presses from bubbling to the backdrop */}
          <Pressable onPress={() => {}} style={{ width: "100%" }}>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 44,
                  fontWeight: "900",
                  color: "#fff",
                  letterSpacing: 0.4,
                  textAlign: "center",
                }}
              >
                It’s a match!
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.92)",
                  marginTop: 10,
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                You and {displayName} liked each other
              </Text>

              <View style={{ height: 34 }} />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderWidth: 3,
                    borderColor: "rgba(255,255,255,0.85)",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {myPhotoUrl ? (
                    <Image
                      source={{ uri: myPhotoUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      transition={120}
                    />
                  ) : loadingMyPhoto ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontWeight: "900",
                        fontSize: 20,
                      }}
                    >
                      You
                    </Text>
                  )}
                </View>

                <View style={{ width: (avatarSize - overlap) * -1 }} />

                <View
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderWidth: 3,
                    borderColor: "rgba(255,255,255,0.85)",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {otherPhotoUrl ? (
                    <Image
                      source={{ uri: otherPhotoUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      transition={120}
                    />
                  ) : (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontWeight: "900",
                        fontSize: 20,
                      }}
                    >
                      {displayName ? displayName[0] : "❤️"}
                    </Text>
                  )}
                </View>
              </View>

              {/* NEW: show what initiated the match + a suggested opener */}
              {matchId && currentUserId ? (
                <View
                  style={{
                    width: "100%",
                    marginTop: 18,
                    borderRadius: 18,
                    backgroundColor: "rgba(255,255,255,0.14)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.28)",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  {starterRes.starterQuery.isLoading ? (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontWeight: "800",
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      Loading match details…
                    </Text>
                  ) : starterSummary ? (
                    <>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.95)",
                          fontWeight: "900",
                          fontSize: 14,
                          textAlign: "center",
                        }}
                      >
                        {starterSummary}
                      </Text>
                      <Text
                        style={{
                          marginTop: 6,
                          color: "rgba(255,255,255,0.92)",
                          fontWeight: "800",
                          fontSize: 13,
                          textAlign: "center",
                        }}
                      >
                        {startChatLine}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.92)",
                        fontWeight: "800",
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      {startChatLine}
                    </Text>
                  )}
                </View>
              ) : null}

              {error ? (
                <Text
                  style={{
                    marginTop: 18,
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              ) : (
                <View style={{ height: 18 }} />
              )}

              <View style={{ height: 22 }} />

              <TouchableOpacity
                onPress={sayHello}
                activeOpacity={0.9}
                disabled={sendingHello}
                style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  paddingVertical: 14,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.14,
                  shadowRadius: 18,
                  opacity: sendingHello ? 0.7 : 1,
                }}
              >
                <Text
                  style={{
                    color: "#111",
                    fontSize: 16,
                    fontWeight: "900",
                  }}
                >
                  {sendingHello ? "Sending…" : "Say hello"}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 12 }} />

              <TouchableOpacity
                onPress={goToMessages}
                activeOpacity={0.9}
                style={{
                  width: "100%",
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.6)",
                  paddingVertical: 14,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "900",
                  }}
                >
                  Go to messages
                </Text>
              </TouchableOpacity>

              <View style={{ height: 12 }} />

              <TouchableOpacity
                onPress={() => onClose?.()}
                activeOpacity={0.9}
                style={{
                  width: "100%",
                  paddingVertical: 12,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 15,
                    fontWeight: "800",
                  }}
                >
                  Maybe later
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </LinearGradient>
      </Pressable>
    </Modal>
  );
}
