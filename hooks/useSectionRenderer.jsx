import { useCallback } from "react";
import { View } from "react-native";
import { PhotoCard } from "@/components/ProfilePreview/PhotoCard";
import { VideoCard } from "@/components/ProfilePreview/VideoCard";
import { AboutSection } from "@/components/ProfilePreview/sections/AboutSection";
import { InterestsSection } from "@/components/ProfilePreview/sections/InterestsSection";
import { BasicsSection } from "@/components/ProfilePreview/sections/BasicsSection";
import { PromptSection } from "@/components/ProfilePreview/sections/PromptSection";
import { VoicePromptSection } from "@/components/ProfilePreview/sections/VoicePromptSection";
import { InsightsSection } from "@/components/ProfilePreview/sections/InsightsSection";
import { SectionActions } from "@/components/ProfilePreview/SectionActions";

export function useSectionRenderer({
  profile,
  titleName,
  topSubtitle,
  locationText,
  basicsItems,
  interests,
  voicePrompt,
  voicePromptPlaying,
  onToggleVoicePrompt,
  shouldFetchInsights,
  insightsQuery,
  dateHistoryLine,
  followThroughLine,
  photos,
  videos,
  getSectionActionMeta,
  shouldShowActions,
  renderSectionActions,
  getPhotoBadge,
  getVideoBadge,
  onOpenProfileMenu,
  onOpenPhotoAtIndex,
  tutorialHeroPhotoRef, // NEW: optional ref for tutorial arrow to hero photo
}) {
  return useCallback(
    (section) => {
      const meta = getSectionActionMeta(section);

      const wrap = (body) => {
        if (!body) {
          return null;
        }
        if (!shouldShowActions) {
          return body;
        }

        return (
          <View style={{ position: "relative" }}>
            {body}
            {renderSectionActions(meta)}
          </View>
        );
      };

      if (section.type === "heroPhoto") {
        const badgeText = getPhotoBadge(true, 0);
        const body = (
          <PhotoCard
            uri={section.uri}
            isHero
            title={titleName}
            subtitle={topSubtitle}
            location={locationText}
            bio={profile?.bio || ""}
            badgeText={badgeText}
            isVerified={profile?.is_verified === true}
            distanceMiles={profile?.distance_miles}
            onPressMenu={onOpenProfileMenu}
            onPressImage={
              typeof onOpenPhotoAtIndex === "function"
                ? () => onOpenPhotoAtIndex(0)
                : null
            }
            containerRef={tutorialHeroPhotoRef}
          />
        );
        return wrap(body);
      }

      if (section.type === "photo") {
        const badgeText = getPhotoBadge(false, section.idx);
        const body = (
          <PhotoCard
            uri={section.uri}
            isHero={false}
            badgeText={badgeText}
            onPressMenu={onOpenProfileMenu}
            onPressImage={
              typeof onOpenPhotoAtIndex === "function"
                ? () => onOpenPhotoAtIndex(section.idx + 1)
                : null
            }
          />
        );
        return wrap(body);
      }

      if (section.type === "video") {
        const badgeText = getVideoBadge(section.idx);
        const body = (
          <VideoCard
            uri={section.uri}
            badgeText={badgeText}
            onPressMenu={onOpenProfileMenu}
          />
        );
        return wrap(body);
      }

      if (section.type === "about") {
        const body = <AboutSection bio={profile?.bio || ""} />;
        return wrap(body);
      }

      if (section.type === "interests") {
        if (!Array.isArray(interests) || interests.length === 0) {
          return null;
        }
        const body = <InterestsSection interests={interests} />;
        return wrap(body);
      }

      if (section.type === "basics") {
        const body = <BasicsSection basicsItems={basicsItems} />;
        return wrap(body);
      }

      if (section.type === "prompt") {
        const body = <PromptSection prompt={section.prompt} />;
        return wrap(body);
      }

      if (section.type === "voice") {
        if (!voicePrompt?.audioUrl) {
          return null;
        }
        const body = (
          <VoicePromptSection
            voicePrompt={voicePrompt}
            voicePromptPlaying={voicePromptPlaying}
            onToggleVoicePrompt={onToggleVoicePrompt}
          />
        );
        return wrap(body);
      }

      if (section.type === "insights") {
        const body = (
          <InsightsSection
            shouldFetchInsights={shouldFetchInsights}
            insightsQuery={insightsQuery}
            dateHistoryLine={dateHistoryLine}
            followThroughLine={followThroughLine}
          />
        );
        return wrap(body);
      }

      return null;
    },
    [
      basicsItems,
      dateHistoryLine,
      followThroughLine,
      getSectionActionMeta,
      getPhotoBadge,
      getVideoBadge,
      interests,
      locationText,
      onToggleVoicePrompt,
      profile?.bio,
      profile?.distance_miles,
      profile?.is_verified,
      renderSectionActions,
      shouldFetchInsights,
      shouldShowActions,
      insightsQuery,
      titleName,
      topSubtitle,
      voicePrompt,
      voicePromptPlaying,
      onOpenProfileMenu,
      onOpenPhotoAtIndex,
      tutorialHeroPhotoRef,
    ],
  );
}
