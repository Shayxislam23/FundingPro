"use client";

type AnalyticsEvent =
  | "landing_cta_click"
  | "auth_otp_sent"
  | "auth_success"
  | "onboarding_step_profile"
  | "onboarding_step_documents"
  | "onboarding_step_saved_grant"
  | "onboarding_step_eligibility"
  | "onboarding_step_ai"
  | "profile_updated"
  | "eligibility_run"
  | "ai_generate"
  | "payment_intent"
  | "subscription_activated"
  | "grant_shared"
  | "lead_magnet_submit";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  }
}

export function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = params.get(key);
    if (v) utm[key] = v;
  }
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem("fp_utm", JSON.stringify(utm));
  }
}

export function getStoredUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("fp_utm");
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function trackEvent(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  const payload = { ...getStoredUtm(), ...props };
  if (window.plausible) {
    const stringProps: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload)) stringProps[k] = String(v);
    window.plausible(event, { props: stringProps });
  }
  if (window.posthog?.capture) {
    window.posthog.capture(event, payload);
  }
}
