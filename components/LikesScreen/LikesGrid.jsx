import { View, ScrollView, Dimensions } from "react-native";
import { LikeCard } from "./LikeCard";
import { UpgradeBanner } from "./UpgradeBanner";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

export function LikesGrid({
  likes,
  isLocked,
  freeVisibleCount,
  insets,
  refreshControl,
  onUpgrade,
  onOpenProfile,
  onLikeBack,
  isLiking,
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={refreshControl}
      contentContainerStyle={{
        padding: 18,
        paddingBottom: insets.bottom + 80,
      }}
    >
      {isLocked ? <UpgradeBanner onUpgrade={onUpgrade} /> : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {likes.map((like, idx) => (
          <LikeCard
            key={like.id}
            like={like}
            index={idx}
            cardWidth={cardWidth}
            isLocked={isLocked}
            freeVisibleCount={freeVisibleCount}
            onOpenProfile={onOpenProfile}
            onUpgrade={onUpgrade}
            onLikeBack={onLikeBack}
            isLiking={isLiking}
          />
        ))}
      </View>
    </ScrollView>
  );
}
