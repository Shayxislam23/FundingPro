import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { CLAY_COLORS } from "../../../lib/clay-styles";

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
};

function TabIcon({ name, focused }: TabIconProps) {
  return <Ionicons name={name} size={22} color={focused ? "#008A2E" : "#6B7F70"} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#008A2E",
        tabBarInactiveTintColor: "#6B7F70",
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 28 : 16,
          left: 16,
          right: 16,
          height: 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 8 : 6,
          backgroundColor: CLAY_COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: CLAY_COLORS.highlight,
          borderRadius: 28,
          borderWidth: 0,
          elevation: 10,
          shadowColor: CLAY_COLORS.shadowDark,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 14,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        sceneStyle: {
          backgroundColor: CLAY_COLORS.canvas,
          paddingBottom: Platform.OS === "ios" ? 100 : 88,
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
