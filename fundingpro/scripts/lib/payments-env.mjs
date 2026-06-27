/**
 * Shared payment provider env validation for check scripts.
 */
export const ALL_PROVIDERS = ["uzum", "payme", "click"];

export function loadMergedEnv(loadEnvFiles) {
  return loadEnvFiles();
}

export function getEnabledProviders(env) {
  if (env.PAYMENTS_ENABLED !== "true") return [];
  const raw = env.PAYMENT_PROVIDERS ?? env.PAYMENT_PROVIDER ?? "uzum";
  const ids = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ALL_PROVIDERS.includes(s));
  return ids.length > 0 ? ids : ["uzum"];
}

export function isUzumConfigured(env) {
  const merchant = !!(env.UZUM_MERCHANT_SERVICE_ID && env.UZUM_MERCHANT_LOGIN && env.UZUM_MERCHANT_PASSWORD);
  const checkout = !!(env.UZUM_CHECKOUT_TERMINAL_ID && env.UZUM_CHECKOUT_SECRET);
  return merchant || checkout;
}

export function uzumConfigDetail(env) {
  const merchant = !!(env.UZUM_MERCHANT_SERVICE_ID && env.UZUM_MERCHANT_LOGIN && env.UZUM_MERCHANT_PASSWORD);
  const checkout = !!(env.UZUM_CHECKOUT_TERMINAL_ID && env.UZUM_CHECKOUT_SECRET);
  if (merchant && checkout) return "merchant+checkout";
  if (merchant) return "merchant";
  if (checkout) return "checkout";
  return "none";
}

export function isPaymeConfigured(env) {
  return !!(env.PAYME_MERCHANT_ID && env.PAYME_MERCHANT_KEY);
}

export function isClickConfigured(env) {
  return !!(env.CLICK_MERCHANT_ID && env.CLICK_SERVICE_ID && env.CLICK_SECRET_KEY);
}

export function isProviderConfigured(provider, env) {
  switch (provider) {
    case "uzum":
      return isUzumConfigured(env);
    case "payme":
      return isPaymeConfigured(env);
    case "click":
      return isClickConfigured(env);
    default:
      return false;
  }
}

/** @returns {{ ok: boolean, issues: string[], warnings: string[] }} */
export function validatePaymentsEnv(env, { requireEnabled = false } = {}) {
  const issues = [];
  const warnings = [];

  if (requireEnabled && env.PAYMENTS_ENABLED !== "true") {
    issues.push("PAYMENTS_ENABLED must be true for go-live");
  }

  if (env.PAYMENTS_ENABLED === "true" && !env.CONVEX_SYSTEM_SECRET?.trim()) {
    warnings.push("CONVEX_SYSTEM_SECRET missing — payment webhooks will fail in production");
  }

  if (!env.NEXT_PUBLIC_CONVEX_URL?.trim()) {
    issues.push("NEXT_PUBLIC_CONVEX_URL missing");
  }

  const enabled = getEnabledProviders(env);
  if (env.PAYMENTS_ENABLED === "true" && enabled.length === 0) {
    issues.push("PAYMENT_PROVIDERS empty while PAYMENTS_ENABLED=true");
  }

  for (const provider of enabled) {
    if (!isProviderConfigured(provider, env)) {
      issues.push(`${provider}: credentials incomplete for enabled provider`);
    }
  }

  if (env.PAYMENTS_ENABLED === "true") {
    for (const provider of ALL_PROVIDERS) {
      if (!enabled.includes(provider) && isProviderConfigured(provider, env)) {
        warnings.push(`${provider}: configured but not listed in PAYMENT_PROVIDERS`);
      }
    }
  }

  return { ok: issues.length === 0, issues, warnings, enabled };
}

export function providerEnvKeys(provider) {
  switch (provider) {
    case "uzum":
      return [
        "UZUM_MERCHANT_SERVICE_ID",
        "UZUM_MERCHANT_LOGIN",
        "UZUM_MERCHANT_PASSWORD",
        "UZUM_CHECKOUT_TERMINAL_ID",
        "UZUM_CHECKOUT_SECRET",
      ];
    case "payme":
      return ["PAYME_MERCHANT_ID", "PAYME_MERCHANT_KEY", "PAYME_TEST_MODE"];
    case "click":
      return ["CLICK_MERCHANT_ID", "CLICK_SERVICE_ID", "CLICK_SECRET_KEY", "CLICK_MERCHANT_USER_ID"];
    default:
      return [];
  }
}
