import * as Sentry from "@sentry/react-native";
import { getAppVersion, getSentryDsn } from "./config";

export function initSentry(): void {
  const dsn = getSentryDsn();
  if (!dsn) return;

  Sentry.init({
    dsn,
    release: `fundingpro-mobile@${getAppVersion()}`,
    tracesSampleRate: 0.2,
    enableNative: true,
  });
}
