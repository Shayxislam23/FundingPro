import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { initSentry } from "../lib/sentry";
import { AuthProvider, useAuth } from "../lib/auth/context";
import { useAuthDeepLink } from "../lib/auth/deep-link";
import { AppQueryProvider } from "../lib/query-client";
import { setupPushNotificationRouting } from "../lib/notifications";
import {
  GuestCarousel,
  hasSeenGuestCarousel,
} from "../components/onboarding/GuestCarousel";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [carouselChecked, setCarouselChecked] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);

  useAuthDeepLink();

  useEffect(() => {
    return setupPushNotificationRouting(router);
  }, [router]);

  useEffect(() => {
    void hasSeenGuestCarousel().then((seen) => {
      setShowCarousel(!seen);
      setCarouselChecked(true);
    });
  }, []);

  useEffect(() => {
    if (isLoading || !carouselChecked) return;
    const inAuth = segments[0] === "(auth)";
    const inPublic = segments[0] === "(public)";
    const inLegal = segments[0] === "(legal)";

    if (!session && !inAuth && !inPublic && !inLegal) {
      router.replace("/(auth)/login");
    } else if (session && inAuth) {
      router.replace("/(app)/(tabs)/home");
    }
  }, [session, isLoading, segments, router, carouselChecked]);

  if (isLoading || !carouselChecked) {
    return (
      <View className="flex-1 items-center justify-center bg-clay-canvas">
        <ActivityIndicator color="#008A2E" size="large" />
      </View>
    );
  }

  return (
    <>
      {children}
      <GuestCarousel visible={showCarousel} onComplete={() => setShowCarousel(false)} />
    </>
  );
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
            <Stack.Screen name="mobile" />
          </Stack>
        </AuthGuard>
      </AppQueryProvider>
    </AuthProvider>
  );
}
