import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../lib/auth/context";

export default function AppLayout() {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="grants/[id]" />
      <Stack.Screen name="tracker" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="consultants" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="subscription/index" />
      <Stack.Screen name="subscription/return" />
      <Stack.Screen name="support" />
      <Stack.Screen name="ai/disclosure" />
    </Stack>
  );
}
