import { View, Text, TouchableOpacity, Keyboard } from "react-native";

export function TabNavigation({ activeTab, setActiveTab }) {
  const tabItems = [
    { key: "chat", label: "Chat" },
    { key: "date", label: "Date" },
    { key: "profile", label: "Profile" },
  ];

  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.82)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(17,17,17,0.06)",
        flexDirection: "row",
        paddingHorizontal: 8,
        paddingBottom: 2,
      }}
    >
      {tabItems.map((t) => {
        const isActive = activeTab === t.key;
        const textColor = isActive ? "#111" : "#6B7280";
        const borderColor = isActive ? "#7C3AED" : "transparent";

        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => {
              Keyboard.dismiss();
              setActiveTab(t.key);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: borderColor,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: isActive ? "900" : "700",
                color: textColor,
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
