import { View } from "react-native";

export function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        padding: 14,
      }}
    >
      {children}
    </View>
  );
}
