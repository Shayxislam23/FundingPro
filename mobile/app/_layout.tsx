import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { initSentry } from "../lib/sentry";
import { AuthProvider, useAuth } from "../lib/auth/context";
import { useAuthDeepLink } from "../lib/auth/deep-link";
import { AppQueryProvider } from "../lib/query-client";
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useAuthDeepLink();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    const inPublic = segments[0] === "(public)";
    const inLegal = segments[0] === "(legal)";

    if (!session && !inAuth && !inPublic && !inLegal) {
      router.replace("/(auth)/login");
    } else if (session && inAuth) {
      router.replace("/(app)/(tabs)/home");
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-funding-light">
        <ActivityIndicator color="#008A2E" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    initSentry();
  }, []);

  return (
    <AuthProvider>
      <AppQueryProvider>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(legal)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="subscription/return" />
          </Stack>
        </AuthGuard>
      </AppQueryProvider>
    </AuthProvider>
  );
}
