import Constants from "expo-constants";

export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL ?? "https://www.fundingpro.uz/api/v1";
  return url.replace(/\/$/, "");
}

export function getSentryDsn(): string | undefined {
  return process.env.EXPO_PUBLIC_SENTRY_DSN;
}

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? "0.1.0";
}
