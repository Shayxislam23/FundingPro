import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ScreenHeader({ title, showBack = true }: { title: string; showBack?: boolean }) {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
      {showBack && (
        <Pressable onPress={() => router.back()} className="mr-3 px-2 py-1">
          <Text className="text-funding-green font-semibold">←</Text>
        </Pressable>
      )}
      <Text className="text-lg font-bold text-funding-black flex-1">{title}</Text>
    </View>
  );
}

export function Screen({ children, title, showBack }: { children: React.ReactNode; title?: string; showBack?: boolean }) {
  return (
    <SafeAreaView className="flex-1 bg-funding-light" edges={["top"]}>
      {title ? <ScreenHeader title={title} showBack={showBack} /> : null}
      {children}
    </SafeAreaView>
  );
}
