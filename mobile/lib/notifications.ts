import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

function getPushPlatform(): "ios" | "android" | null {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return null;
}

/** Request permissions, obtain Expo push token, and register with backend. */
export async function registerAndSyncPushToken(): Promise<void> {
  const platform = getPushPlatform();
  if (!platform) return;

  const token = await registerForPushNotifications();
  if (!token) return;

  try {
    await api.registerPushToken(token, platform);
  } catch {
    // Non-fatal: user may be offline or API temporarily unavailable.
  }
}
