import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { QueuedMatchesCard } from "./QueuedMatchesCard";

export function NewMatchesSection({
  newMatches,
  hasNewMatches,
  hasAnyMatches,
  onMatchPress,
  hasActiveConversation,
  queuedCount,
  onPressOpenCurrentChat,
  pendingMatchCount = 0,
  // keep these props for compatibility (gating now happens via a full-screen modal)
  credits = 0,
  shouldGateMatchQueue = false,
  onPressBuyCredits,
}) {
  const pendingCountSafe = Number(pendingMatchCount) || 0;
  const hasPending = pendingCountSafe > 0;

  const creditsSafe = Number(credits || 0);
  const showCreditsNudge = !hasActiveConversation && creditsSafe <= 0;

  const showNewMatchesScroller = hasNewMatches;

  const pendingTitle =
    pendingCountSafe > 1
      ? `${pendingCountSafe} matches pending`
      : "Match pending";

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "900",
          color: "#111",
          marginBottom: 10,
          paddingHorizontal: 4,
        }}
      >
        New Matches
      </Text>

      {showCreditsNudge ? (
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.72)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            padding: 14,
            marginHorizontal: 4,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
            You have 0 date credits
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
            Add a credit now so you can open matches as soon as they land.
          </Text>

          {onPressBuyCredits ? (
            <TouchableOpacity
              onPress={onPressBuyCredits}
              activeOpacity={0.9}
              style={{
                marginTop: 12,
                backgroundColor: "rgba(255,79,216,0.12)",
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,79,216,0.18)",
              }}
            >
              <Text style={{ fontWeight: "900", color: "#111" }}>
                Buy date credits
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {hasActiveConversation ? (
        <QueuedMatchesCard
          queuedCount={queuedCount}
          onPressOpenChat={onPressOpenCurrentChat}
        />
      ) : (
        <>
          {hasPending ? (
            <QueuedMatchesCard
              queuedCount={pendingCountSafe}
              title={pendingTitle}
              subtitle="You’ll be notified if this path opens."
              onPressOpenChat={null}
            />
          ) : null}

          {showNewMatchesScroller ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginTop: hasPending ? 12 : 0 }}
              contentContainerStyle={{ paddingHorizontal: 4, paddingRight: 16 }}
            >
              {Array.isArray(newMatches)
                ? newMatches.map((match, idx) => {
                    const matchIdValue =
                      match?.match_id != null ? String(match.match_id) : "";

                    const keyValue = matchIdValue
                      ? `new-match-${matchIdValue}`
                      : `new-match-idx-${idx}`;

                    const displayNameValue =
                      typeof match?.display_name === "string"
                        ? match.display_name
                        : "";

                    const photoUrlValue =
                      typeof match?.photos?.[0] === "string"
                        ? match.photos[0]
                        : "https://via.placeholder.com/160";

                    const handlePress = () => {
                      if (!matchIdValue) return;
                      onMatchPress(match);
                    };

                    return (
                      <TouchableOpacity
                        key={keyValue}
                        onPress={handlePress}
                        activeOpacity={0.9}
                        style={{ marginRight: 12 }}
                      >
                        <View
                          style={{
                            width: 110,
                            backgroundColor: "rgba(255,255,255,0.86)",
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: "rgba(17,17,17,0.06)",
                            overflow: "hidden",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.08,
                            shadowRadius: 18,
                          }}
                        >
                          <Image
                            source={{ uri: photoUrlValue }}
                            style={{ width: 110, height: 140 }}
                            resizeMode="cover"
                          />

                          <View style={{ padding: 10 }}>
                            <Text
                              numberOfLines={1}
                              style={{
                                fontSize: 14,
                                fontWeight: "900",
                                color: "#111",
                              }}
                            >
                              {displayNameValue}
                            </Text>

                            <Text
                              numberOfLines={1}
                              style={{
                                marginTop: 2,
                                fontSize: 11,
                                fontWeight: "800",
                                color: "#6B7280",
                              }}
                            >
                              Tap to open
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                : null}
            </ScrollView>
          ) : hasPending ? null : (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.72)",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "rgba(17,17,17,0.06)",
                padding: 14,
                marginHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#111" }}>
                {hasAnyMatches ? "No new matches yet" : "No matches yet"}
              </Text>
              <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
                {hasAnyMatches
                  ? "When you match with someone new, they'll show up here."
                  : "Start swiping — when you match, they'll show up here."}
              </Text>

              <View style={{ flexDirection: "row", marginTop: 12 }}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={`nm-placeholder-${i}`}
                    style={{
                      width: 58,
                      height: 72,
                      borderRadius: 16,
                      backgroundColor: "rgba(17,17,17,0.06)",
                      marginRight: 10,
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {/* keep these props referenced so they aren't removed by refactors */}
          {credits || shouldGateMatchQueue || onPressBuyCredits ? null : null}
        </>
      )}
    </View>
  );
}
