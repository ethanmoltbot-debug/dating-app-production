import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { EditProfileHeader } from "@/components/EditProfile/EditProfileHeader";
import { NameSection } from "@/components/EditProfile/NameSection";
import { BasicsSection } from "@/components/EditProfile/BasicsSection";
import { PhotosSection } from "@/components/EditProfile/PhotosSection";
import { BioSection } from "@/components/EditProfile/BioSection";
import { InterestsSection } from "@/components/EditProfile/InterestsSection";
import { PromptsSection } from "@/components/EditProfile/PromptsSection";
import { VoicePromptSection } from "@/components/EditProfile/VoicePromptSection";
import { TipCard } from "@/components/EditProfile/TipCard";
import { PromptPickerModal } from "@/components/EditProfile/PromptPickerModal";
import { ProfilePreviewContent } from "@/components/ProfilePreview/ProfilePreviewContent";
import { useEditProfile } from "@/hooks/useEditProfile";

const ACCENT = "#7C3AED";
const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];

function SoftBlobsBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -80,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: "rgba(255, 79, 216, 0.16)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 120,
          right: -110,
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: "rgba(124, 58, 237, 0.14)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -120,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: "rgba(99, 179, 237, 0.16)",
        }}
      />
    </View>
  );
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("edit");

  const {
    displayName,
    bio,
    photos,
    videos,
    interests,
    prompts,
    voicePrompt,
    promptPickerOpen,
    recorderState,
    recordingBusy,
    isVoiceRecording,
    voicePlaying,
    voiceRecordingTime,
    voiceWaveformLive,
    voicePlaybackTime,
    voicePlaybackDuration,
    uploading,
    uploadProgress,
    uploadBytesSent,
    uploadBytesTotal,
    isLoading,
    error,
    saveMutation,

    age,
    gender,
    location,
    phoneNumber,
    category,
    basicHeight,
    basicJobTitle,
    basicCompany,
    basicEducation,
    basicLookingFor,
    basicSexuality,

    setDisplayName,
    setBio,
    setInterests,

    setAge,
    setGender,
    setLocation,
    setPhoneNumber,
    setCategory,
    setBasicHeight,
    setBasicJobTitle,
    setBasicCompany,
    setBasicEducation,
    setBasicLookingFor,
    setBasicSexuality,

    addPhoto,
    removePhoto,
    reorderPhotos,
    removeVideo,
    removeInterest,
    setPromptAnswer,
    openPromptPicker,
    toggleRecordingVoicePrompt,
    togglePlayVoicePrompt,
    removeVoiceAudio,
    selectVoiceQuestion,
    onPickPromptQuestion,
    setPromptPickerOpen,
    data,
    setSingleVideoUrl,
  } = useEditProfile();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const readPending = async () => {
        try {
          const url = await AsyncStorage.getItem("pending_profile_video_url");
          if (url) {
            await AsyncStorage.removeItem("pending_profile_video_url");
            if (!cancelled) {
              setSingleVideoUrl(url);
            }
          }
        } catch (e) {
          console.error(e);
        }

        try {
          const raw = await AsyncStorage.getItem("interest_picker_result");
          if (!raw) return;
          await AsyncStorage.removeItem("interest_picker_result");
          if (cancelled) return;
          const parsed = JSON.parse(raw);
          const next = Array.isArray(parsed?.interests) ? parsed.interests : [];
          setInterests(next);
        } catch (e) {
          console.error(e);
        }
      };

      readPending();

      return () => {
        cancelled = true;
      };
    }, [setInterests, setSingleVideoUrl]),
  );

  const onAddVideo = useCallback(() => {
    const count = Array.isArray(videos) ? videos.length : 0;
    if (count >= 1) {
      Alert.alert(
        "Video already added",
        "You can upload 1 video max. Remove the current one to upload a different video.",
      );
      return;
    }
    router.push("/profile/record-video");
  }, [router, videos]);

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  const onSave = useCallback(() => {
    saveMutation.mutate(undefined, {
      onSuccess: () => {
        Alert.alert("Saved", "Your profile has been updated.");
        router.back();
      },
    });
  }, [saveMutation, router]);

  const saving = saveMutation.isPending;
  const busy = saving || uploading || recordingBusy;
  const isEditTab = activeTab !== "view";

  const serverPreferences = useMemo(() => {
    const raw = data?.profile?.preferences;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }, [data?.profile?.preferences]);

  const previewPreferences = useMemo(() => {
    const workCombined =
      basicJobTitle && basicCompany
        ? `${basicJobTitle} at ${basicCompany}`
        : basicJobTitle
          ? basicJobTitle
          : basicCompany
            ? `Works at ${basicCompany}`
            : "";

    return {
      ...serverPreferences,
      category,
      interests,
      prompts,
      voicePrompt,
      videos,
      basics: {
        ...(serverPreferences?.basics &&
        typeof serverPreferences.basics === "object"
          ? serverPreferences.basics
          : {}),
        height: basicHeight,
        jobTitle: basicJobTitle,
        company: basicCompany,
        work: workCombined,
        education: basicEducation,
        lookingFor: basicLookingFor,
        sexuality: basicSexuality,
      },
    };
  }, [
    basicCompany,
    basicEducation,
    basicHeight,
    basicJobTitle,
    basicLookingFor,
    basicSexuality,
    category,
    interests,
    prompts,
    serverPreferences,
    videos,
    voicePrompt,
  ]);

  const previewProfile = useMemo(() => {
    const base = data?.profile || {};

    const ageTrimmed = String(age || "").trim();
    const ageNum = ageTrimmed ? Number(ageTrimmed) : null;
    const resolvedAge = Number.isFinite(ageNum) ? ageNum : base.age;

    const resolvedGender = gender ? gender : base.gender;
    const resolvedLocation = location ? location : base.location;

    return {
      ...base,
      display_name: displayName,
      age: resolvedAge,
      gender: resolvedGender,
      location: resolvedLocation,
      bio,
      photos,
    };
  }, [age, bio, data?.profile, displayName, gender, location, photos]);

  const promptModal = useMemo(() => {
    if (!isEditTab) return null;
    return (
      <PromptPickerModal
        visible={promptPickerOpen}
        onClose={() => setPromptPickerOpen(false)}
        onSelectQuestion={onPickPromptQuestion}
        bottomInset={insets.bottom}
      />
    );
  }, [
    insets.bottom,
    isEditTab,
    onPickPromptQuestion,
    promptPickerOpen,
    setPromptPickerOpen,
  ]);

  const mainContent = useMemo(() => {
    if (!isEditTab) {
      return (
        <ProfilePreviewContent
          profile={previewProfile}
          preferences={previewPreferences}
          bottomInset={insets.bottom}
        />
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Put media first (most common edit) */}
        <PhotosSection
          photos={photos}
          videos={videos}
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadBytesSent={uploadBytesSent}
          uploadBytesTotal={uploadBytesTotal}
          onAddPhoto={addPhoto}
          onAddVideo={onAddVideo}
          onRemovePhoto={removePhoto}
          onReorderPhotos={reorderPhotos}
          onRemoveVideo={removeVideo}
        />

        <NameSection displayName={displayName} onChangeText={setDisplayName} />

        <BasicsSection
          age={age}
          gender={gender}
          location={location}
          phoneNumber={phoneNumber}
          category={category}
          sexuality={basicSexuality}
          height={basicHeight}
          lookingFor={basicLookingFor}
          jobTitle={basicJobTitle}
          company={basicCompany}
          education={basicEducation}
          onChangeAge={setAge}
          onChangeGender={setGender}
          onChangeLocation={setLocation}
          onChangePhoneNumber={setPhoneNumber}
          onChangeCategory={setCategory}
          onChangeSexuality={setBasicSexuality}
          onChangeHeight={setBasicHeight}
          onChangeLookingFor={setBasicLookingFor}
          onChangeJobTitle={setBasicJobTitle}
          onChangeCompany={setBasicCompany}
          onChangeEducation={setBasicEducation}
        />

        <BioSection bio={bio} onChangeText={setBio} />

        <InterestsSection
          interests={interests}
          onRemoveInterest={removeInterest}
        />

        <PromptsSection
          prompts={prompts}
          onOpenPicker={openPromptPicker}
          onChangeAnswer={setPromptAnswer}
        />

        <VoicePromptSection
          voicePrompt={voicePrompt}
          isRecording={isVoiceRecording}
          recordingTime={voiceRecordingTime}
          waveform={
            isVoiceRecording
              ? voiceWaveformLive
              : Array.isArray(voicePrompt?.waveform)
                ? voicePrompt.waveform
                : []
          }
          playbackTime={voicePlaybackTime}
          playbackDuration={voicePlaybackDuration}
          recordingBusy={recordingBusy}
          voicePlaying={voicePlaying}
          onSelectQuestion={selectVoiceQuestion}
          onToggleRecording={toggleRecordingVoicePrompt}
          onTogglePlay={togglePlayVoicePrompt}
          onRemoveAudio={removeVoiceAudio}
        />

        <TipCard />
      </ScrollView>
    );
  }, [
    addPhoto,
    age,
    basicCompany,
    basicEducation,
    basicHeight,
    basicJobTitle,
    basicLookingFor,
    basicSexuality,
    bio,
    displayName,
    gender,
    insets.bottom,
    interests,
    isEditTab,
    isVoiceRecording,
    location,
    openPromptPicker,
    photos,
    previewPreferences,
    previewProfile,
    prompts,
    recordingBusy,
    removeInterest,
    removePhoto,
    removeVideo,
    removeVoiceAudio,
    selectVoiceQuestion,
    setAge,
    setBasicCompany,
    setBasicEducation,
    setBasicHeight,
    setBasicJobTitle,
    setBasicLookingFor,
    setBasicSexuality,
    setBio,
    setCategory,
    setDisplayName,
    setGender,
    setLocation,
    setPhoneNumber,
    setPromptAnswer,
    togglePlayVoicePrompt,
    toggleRecordingVoicePrompt,
    uploading,
    uploadProgress,
    uploadBytesSent,
    uploadBytesTotal,
    videos,
    voicePlaying,
    voicePlaybackDuration,
    voicePlaybackTime,
    voicePrompt,
    voiceRecordingTime,
    voiceWaveformLive,
  ]);

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={BG_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SoftBlobsBackground />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: insets.top,
          }}
        >
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={BG_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SoftBlobsBackground />
        <View
          style={{
            flex: 1,
            paddingTop: insets.top,
            paddingHorizontal: 18,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: 22,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(17,17,17,0.06)",
            }}
          >
            <Text style={{ color: "#111", fontSize: 18, fontWeight: "800" }}>
              Could not load profile
            </Text>
            <Text style={{ color: "#6B7280", marginTop: 8 }}>
              {error?.message || "Please try again."}
            </Text>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.9}
              style={{
                marginTop: 14,
                backgroundColor: "#111",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      <EditProfileHeader
        topInset={insets.top}
        busy={busy}
        saving={saving}
        onClose={onClose}
        onSave={onSave}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {mainContent}

      {promptModal}
    </View>
  );
}
