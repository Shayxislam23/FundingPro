import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api/client";

type ExpoRouter = {
  push: (href: never) => void;
};

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

type NotificationData = Record<string, unknown>;

function routeFromNotificationData(data: NotificationData | undefined, router: ExpoRouter): void {
  const applicationId =
    typeof data?.applicationId === "string"
      ? data.applicationId
      : typeof data?.application_id === "string"
        ? data.application_id
        : undefined;

  if (applicationId) {
    router.push(`/(app)/tracker/${applicationId}` as never);
    return;
  }

  const screen = typeof data?.screen === "string" ? data.screen : undefined;
  if (screen === "tracker") {
    router.push("/(app)/tracker" as never);
    return;
  }

  router.push("/(app)/(tabs)/home" as never);
}

/** Navigate to tracker or home when the user taps a push notification. */
export function setupPushNotificationRouting(router: ExpoRouter): () => void {
  const handleResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData | undefined;
    routeFromNotificationData(data, router);
  };

  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handleResponse(response);
  });

  return () => subscription.remove();
}
