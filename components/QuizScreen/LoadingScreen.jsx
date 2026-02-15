import { View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SoftBlobsBackground } from "./SoftBlobsBackground";

export function LoadingScreen({ bgGradient, accent }) {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    </View>
  );
}
