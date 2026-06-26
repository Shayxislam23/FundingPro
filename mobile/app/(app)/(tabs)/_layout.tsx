import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text className={`text-xs ${focused ? "text-funding-green font-semibold" : "text-gray-500"}`}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#008A2E",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Главная",
          tabBarLabel: ({ focused }) => <TabLabel label="Главная" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="grants"
        options={{
          title: "Гранты",
          tabBarLabel: ({ focused }) => <TabLabel label="Гранты" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="eligibility"
        options={{
          title: "Проверка",
          tabBarLabel: ({ focused }) => <TabLabel label="Проверка" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ai-writer"
        options={{
          title: "AI",
          tabBarLabel: ({ focused }) => <TabLabel label="AI" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Ещё",
          tabBarLabel: ({ focused }) => <TabLabel label="Ещё" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
