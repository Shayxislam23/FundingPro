import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth/context";

export default function Index() {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
  if (session) return <Redirect href="/(app)/(tabs)/home" />;
  return <Redirect href="/(public)" />;
}
