import type { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";

export async function safeImpactAsync(style?: ImpactFeedbackStyle): Promise<void> {
  try {
    const Haptics = await import("expo-haptics");
    await Haptics.impactAsync(style ?? Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // expo-haptics native module not in dev client
  }
}

export async function safeNotificationAsync(type: NotificationFeedbackType): Promise<void> {
  try {
    const Haptics = await import("expo-haptics");
    await Haptics.notificationAsync(type);
  } catch {
    // expo-haptics native module not in dev client
  }
}

export async function safeNotificationSuccess(): Promise<void> {
  try {
    const Haptics = await import("expo-haptics");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // expo-haptics native module not in dev client
  }
}
