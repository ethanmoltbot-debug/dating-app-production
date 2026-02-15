import { ScrollView } from "react-native";
import { SectionHeader } from "./SectionHeader";
import { PendingMatchCard } from "./PendingMatchCard";
import { EmptyMessagesState } from "./EmptyMessagesState";
import { MatchCard } from "./MatchCard";

export function MatchesSection({ matchRows, pendingMatchCount, onOpenThread }) {
  return (
    <>
      <SectionHeader title="Matches" />

      <PendingMatchCard count={pendingMatchCount} />

      {matchRows.length === 0 ? (
        <EmptyMessagesState section="matches" />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingRight: 22,
          }}
        >
          {matchRows.map((m, idx) => (
            <MatchCard
              key={String(m.match_id || idx)}
              match={m}
              onPress={onOpenThread}
            />
          ))}
        </ScrollView>
      )}
    </>
  );
}
