import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
};

function TabIcon({ name, focused }: TabIconProps) {
  return <Ionicons name={name} size={22} color={focused ? "#008A2E" : "#6B7280"} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#008A2E",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F3F4F6",
          borderTopWidth: 1,
          paddingTop: 4,
          height: Platform.OS === "ios" ? 88 : 64,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Главная",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="grants"
        options={{
          title: "Гранты",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "search" : "search-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="eligibility"
        options={{
          title: "Проверка",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "checkmark-circle" : "checkmark-circle-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-writer"
        options={{
          title: "AI",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "sparkles" : "sparkles-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Ещё",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "menu" : "menu-outline"} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
