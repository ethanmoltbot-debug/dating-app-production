import { useState } from "react";

export function useProfileState() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);

  // Basics (shown with icons on the View tab)
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Discover category (0 or 1). Stored in preferences.category.
  const [category, setCategory] = useState("");

  const [basicHeight, setBasicHeight] = useState("");
  const [basicJobTitle, setBasicJobTitle] = useState("");
  const [basicCompany, setBasicCompany] = useState("");
  const [basicEducation, setBasicEducation] = useState("");
  const [basicLookingFor, setBasicLookingFor] = useState("");
  const [basicSexuality, setBasicSexuality] = useState("");

  const [interests, setInterests] = useState([]);
  const [interestDraft, setInterestDraft] = useState("");

  const [prompts, setPrompts] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  const [promptPickerOpen, setPromptPickerOpen] = useState(false);
  const [promptPickerIndex, setPromptPickerIndex] = useState(0);

  const [voicePrompt, setVoicePrompt] = useState({
    question: "",
    audioUrl: "",
    fileName: "",
    waveform: [],
  });

  return {
    displayName,
    setDisplayName,
    bio,
    setBio,
    photos,
    setPhotos,
    videos,
    setVideos,
    age,
    setAge,
    gender,
    setGender,
    location,
    setLocation,
    phoneNumber,
    setPhoneNumber,
    category,
    setCategory,
    basicHeight,
    setBasicHeight,
    basicJobTitle,
    setBasicJobTitle,
    basicCompany,
    setBasicCompany,
    basicEducation,
    setBasicEducation,
    basicLookingFor,
    setBasicLookingFor,
    basicSexuality,
    setBasicSexuality,
    interests,
    setInterests,
    interestDraft,
    setInterestDraft,
    prompts,
    setPrompts,
    promptPickerOpen,
    setPromptPickerOpen,
    promptPickerIndex,
    setPromptPickerIndex,
    voicePrompt,
    setVoicePrompt,
  };
}
