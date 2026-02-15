import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useProfileData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        throw new Error("You're not signed in.");
      }
      const user = JSON.parse(userData);

      const response = await fetch(`/api/profile/me?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(
          `When fetching /api/profile/me, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const json = await response.json();
      return { user, profile: json.profile };
    },
  });

  const serverProfile = data?.profile;

  const preferences = useMemo(() => {
    const raw = serverProfile?.preferences;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }, [serverProfile?.preferences]);

  return {
    data,
    isLoading,
    error,
    serverProfile,
    preferences,
  };
}
