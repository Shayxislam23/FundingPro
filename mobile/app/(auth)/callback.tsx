import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.replace("/(app)/(tabs)/home");
      return;
    }

    const timer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn]);

  return (
    <SafeAreaView className="flex-1 bg-funding-light items-center justify-center">
      <ActivityIndicator color="#008A2E" />
      <Text className="mt-3 text-gray-500">Подтверждение входа…</Text>
    </SafeAreaView>
  );
}
