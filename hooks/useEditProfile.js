import useUpload from "@/utils/useUpload";
import { useProfileState } from "./useEditProfile/useProfileState";
import { useProfileData } from "./useEditProfile/useProfileData";
import { useProfileHydration } from "./useEditProfile/useProfileHydration";
import { useProfileSave } from "./useEditProfile/useProfileSave";
import { usePhotoActions } from "./useEditProfile/usePhotoActions";
import { useVideoActions } from "./useEditProfile/useVideoActions";
import { useInterestActions } from "./useEditProfile/useInterestActions";
import { usePromptActions } from "./useEditProfile/usePromptActions";
import { useVoiceRecording } from "./useEditProfile/useVoiceRecording";
import { useVoicePromptActions } from "./useEditProfile/useVoicePromptActions";
import { useMediaHelpers } from "./useEditProfile/mediaHelpers";

export function useEditProfile() {
  const [
    upload,
    {
      loading: uploading,
      progress: uploadProgress,
      bytesSent: uploadBytesSent,
      bytesTotal: uploadBytesTotal,
    },
  ] = useUpload();

  // State management
  const profileState = useProfileState();

  // Data fetching
  const { data, isLoading, error, serverProfile, preferences } =
    useProfileData();

  // Media helpers
  const { normalizeVideoUrl } = useMediaHelpers();

  // Hydrate state from server data
  useProfileHydration({
    data,
    serverProfile,
    preferences,
    setDisplayName: profileState.setDisplayName,
    setBio: profileState.setBio,
    setPhotos: profileState.setPhotos,
    setAge: profileState.setAge,
    setGender: profileState.setGender,
    setLocation: profileState.setLocation,
    setPhoneNumber: profileState.setPhoneNumber,
    setCategory: profileState.setCategory,
    setBasicHeight: profileState.setBasicHeight,
    setBasicJobTitle: profileState.setBasicJobTitle,
    setBasicCompany: profileState.setBasicCompany,
    setBasicEducation: profileState.setBasicEducation,
    setBasicLookingFor: profileState.setBasicLookingFor,
    setBasicSexuality: profileState.setBasicSexuality,
    setVideos: profileState.setVideos,
    setInterests: profileState.setInterests,
    setPrompts: profileState.setPrompts,
    setVoicePrompt: profileState.setVoicePrompt,
    normalizeVideoUrl,
  });

  // Save mutation
  const saveMutation = useProfileSave({
    data,
    preferences,
    displayName: profileState.displayName,
    age: profileState.age,
    gender: profileState.gender,
    bio: profileState.bio,
    photos: profileState.photos,
    location: profileState.location,
    phoneNumber: profileState.phoneNumber,
    category: profileState.category,
    basicHeight: profileState.basicHeight,
    basicJobTitle: profileState.basicJobTitle,
    basicCompany: profileState.basicCompany,
    basicEducation: profileState.basicEducation,
    basicLookingFor: profileState.basicLookingFor,
    basicSexuality: profileState.basicSexuality,
    interests: profileState.interests,
    prompts: profileState.prompts,
    voicePrompt: profileState.voicePrompt,
    videos: profileState.videos,
    normalizeVideoUrl,
  });

  // Photo actions
  const { addPhoto, removePhoto, reorderPhotos } = usePhotoActions({
    setPhotos: profileState.setPhotos,
    upload,
    userId: data?.user?.id,
  });

  // Video actions
  const { addVideo, removeVideo, setSingleVideoUrl } = useVideoActions({
    videos: profileState.videos,
    setVideos: profileState.setVideos,
    upload,
    normalizeVideoUrl,
  });

  // Interest actions
  const { addInterest, removeInterest } = useInterestActions({
    interestDraft: profileState.interestDraft,
    setInterests: profileState.setInterests,
    setInterestDraft: profileState.setInterestDraft,
  });

  // Prompt actions
  const {
    setPromptQuestion,
    setPromptAnswer,
    openPromptPicker,
    selectVoiceQuestion,
    onPickPromptQuestion,
  } = usePromptActions({
    setPrompts: profileState.setPrompts,
    setPromptPickerOpen: profileState.setPromptPickerOpen,
    setPromptPickerIndex: profileState.setPromptPickerIndex,
    promptPickerIndex: profileState.promptPickerIndex,
    setVoicePrompt: profileState.setVoicePrompt,
  });

  // Voice recording
  const {
    recorderState,
    recordingBusy,
    isRecordingUi: isVoiceRecording,
    voiceRecordingTime,
    voiceWaveformLive,
    toggleRecordingVoicePrompt,
  } = useVoiceRecording({
    upload,
    setVoicePrompt: profileState.setVoicePrompt,
  });

  // Voice prompt actions
  const {
    voicePlaying,
    voicePlaybackTime,
    voicePlaybackDuration,
    pickVoiceAudioFile,
    togglePlayVoicePrompt,
    removeVoiceAudio,
  } = useVoicePromptActions({
    voicePrompt: profileState.voicePrompt,
    setVoicePrompt: profileState.setVoicePrompt,
    upload,
  });

  return {
    // State
    displayName: profileState.displayName,
    bio: profileState.bio,
    photos: profileState.photos,
    videos: profileState.videos,

    age: profileState.age,
    gender: profileState.gender,
    location: profileState.location,
    phoneNumber: profileState.phoneNumber,
    category: profileState.category,
    basicHeight: profileState.basicHeight,
    basicJobTitle: profileState.basicJobTitle,
    basicCompany: profileState.basicCompany,
    basicEducation: profileState.basicEducation,
    basicLookingFor: profileState.basicLookingFor,
    basicSexuality: profileState.basicSexuality,

    interests: profileState.interests,
    interestDraft: profileState.interestDraft,
    prompts: profileState.prompts,
    voicePrompt: profileState.voicePrompt,
    promptPickerOpen: profileState.promptPickerOpen,
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

    // Query state
    isLoading,
    error,
    data,

    // Mutation
    saveMutation,

    // Setters
    setDisplayName: profileState.setDisplayName,
    setBio: profileState.setBio,
    setInterestDraft: profileState.setInterestDraft,
    setInterests: profileState.setInterests,

    setAge: profileState.setAge,
    setGender: profileState.setGender,
    setLocation: profileState.setLocation,
    setPhoneNumber: profileState.setPhoneNumber,
    setCategory: profileState.setCategory,
    setBasicHeight: profileState.setBasicHeight,
    setBasicJobTitle: profileState.setBasicJobTitle,
    setBasicCompany: profileState.setBasicCompany,
    setBasicEducation: profileState.setBasicEducation,
    setBasicLookingFor: profileState.setBasicLookingFor,
    setBasicSexuality: profileState.setBasicSexuality,

    // Actions
    addPhoto,
    addVideo,
    removePhoto,
    reorderPhotos,
    removeVideo,
    setSingleVideoUrl,
    addInterest,
    removeInterest,
    setPromptAnswer,
    openPromptPicker,
    pickVoiceAudioFile,
    toggleRecordingVoicePrompt,
    togglePlayVoicePrompt,
    removeVoiceAudio,
    selectVoiceQuestion,
    onPickPromptQuestion,
    setPromptPickerOpen: profileState.setPromptPickerOpen,
  };
}
