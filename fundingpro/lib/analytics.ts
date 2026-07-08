"use client";

/**
 * GROWTH_PLAYBOOK / GTM event names — keep in sync with docs/GROWTH_PLAYBOOK.md and docs/PILOT.md.
 *
 * Acquisition: landing_cta_click, lab_cta_click, lead_magnet_submit, grant_shared
 * Activation: auth_success, onboarding_step_*, lab_profile_saved, lab_checkout_started
 * Engagement: eligibility_run, ai_generate, lab_task_submitted
 * North Star (Lab): north_star_application_submitted, north_star_certificate_eligible, north_star_pmf_response
 * Revenue: payment_intent, subscription_activated
 */

type AnalyticsEvent =
  | "landing_cta_click"
  | "lab_cta_click"
  | "auth_otp_sent"
  | "auth_success"
  | "onboarding_step_profile"
  | "onboarding_step_documents"
  | "onboarding_step_saved_grant"
  | "onboarding_step_eligibility"
  | "onboarding_step_ai"
  | "onboarding_step_lab_profile"
  | "onboarding_step_lab_interests"
  | "profile_updated"
  | "lab_profile_saved"
  | "lab_checkout_started"
  | "eligibility_run"
  | "ai_generate"
  | "lab_task_submitted"
  | "pmf_survey_response"
  | "north_star_application_submitted"
  | "north_star_certificate_eligible"
  | "north_star_pmf_response"
  | "payment_intent"
  | "subscription_activated"
  | "grant_shared"
  | "lead_magnet_submit";

export type PmfSurveyAnswer = "very_disappointed" | "somewhat_disappointed" | "not_disappointed";

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

export function trackPmfSurvey(answer: PmfSurveyAnswer): void {
  trackEvent("pmf_survey_response", { answer, survey: "sean_ellis_lab" });
  trackEvent("north_star_pmf_response", { answer, survey: "sean_ellis_lab" });
  if (typeof window !== "undefined") {
    localStorage.setItem("fp_pmf_lab_survey", answer);
  }
}

export function hasCompletedPmfSurvey(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("fp_pmf_lab_survey");
}
