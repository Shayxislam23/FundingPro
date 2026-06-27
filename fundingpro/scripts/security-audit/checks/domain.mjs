import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const fundingproRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

export function runDomainChecks() {
  const findings = [];

  // AI gateway
  const aiGateway = readFileSync(join(fundingproRoot, "lib/ai-gateway.ts"), "utf8");
  if (!aiGateway.includes("redact") && !aiGateway.includes("sanitize")) {
    findings.push({
      id: "AI-NO-REDACTION",
      severity: "High",
      title: "AI gateway may lack PII redaction",
      file: "lib/ai-gateway.ts",
    });
  } else {
    findings.push({
      id: "AI-REDACTION-PRESENT",
      severity: "Informational",
      title: "AI gateway includes PII redaction patterns",
      status: "pass",
    });
  }

  // AI rate limit — dev-only memory fallback is acceptable when production denies without Convex
  const aiRate = readFileSync(join(fundingproRoot, "lib/ai-rate-limit.ts"), "utf8");
  const prodDeniesWithoutConvex =
    aiRate.includes("Rate limit backend unavailable; denying request") &&
    aiRate.includes("shouldUseMemoryFallback");
  if ((aiRate.includes("memory") || aiRate.includes("Map")) && !prodDeniesWithoutConvex) {
    findings.push({
      id: "AI-RATE-LIMIT-MEMORY",
      severity: "Medium",
      title: "AI rate limiting has in-memory fallback on serverless",
      file: "lib/ai-rate-limit.ts",
      remediation: "Rely solely on rate_limit_buckets table in production",
    });
  }

  // Uzum auth timing
  const uzumAuth = readFileSync(join(fundingproRoot, "lib/payments/uzum-auth.ts"), "utf8");
  if (uzumAuth.includes("timingSafeEqual")) {
    findings.push({
      id: "UZUM-TIMING-SAFE",
      severity: "Informational",
      title: "Uzum Basic auth uses timing-safe comparison",
      status: "pass",
    });
  } else if (uzumAuth.includes("===")) {
    findings.push({
      id: "UZUM-TIMING-UNSAFE",
      severity: "Low",
      title: "Uzum Basic auth uses non-timing-safe comparison",
      file: "lib/payments/uzum-auth.ts",
      remediation: "Use crypto.timingSafeEqual for credential comparison",
    });
  }

  // File upload
  const upload = readFileSync(join(fundingproRoot, "app/api/v1/documents/upload/route.ts"), "utf8");
  if (upload.includes("convexInternalMutation") || upload.includes("getConvexAdmin")) {
    findings.push({
      id: "UPLOAD-ADMIN-STORAGE",
      severity: "Informational",
      title: "Document upload uses Convex storage — verify auth on upload route",
      file: "app/api/v1/documents/upload/route.ts",
      status: "mitigated",
    });
  }
  if (upload.includes("file-sniff") || upload.includes("sniffMime")) {
    findings.push({
      id: "UPLOAD-MIME-SNIFF",
      severity: "Informational",
      title: "Upload route validates MIME via magic-byte sniffing",
      status: "pass",
    });
  }

  // admin-check without account status
  const adminCheck = readFileSync(join(fundingproRoot, "app/api/v1/auth/admin-check/route.ts"), "utf8");
  if (adminCheck.includes("getCurrentUser") && !adminCheck.includes("requireActiveUser")) {
    findings.push({
      id: "ADMIN-CHECK-NO-STATUS",
      severity: "Low",
      title: "admin-check endpoint skips banned/disabled account validation",
      file: "app/api/v1/auth/admin-check/route.ts",
    });
  }

  // health error leak
  const health = readFileSync(join(fundingproRoot, "app/api/v1/health/route.ts"), "utf8");
  if (health.includes("dbError") && health.includes("isProduction")) {
    findings.push({
      id: "HEALTH-ERROR-LEAK",
      severity: "Low",
      title: "Health endpoint exposes dbError in non-production only (verify prod)",
      file: "app/api/v1/health/route.ts",
      status: "mitigated-in-prod",
    });
  }

  // CORS env unused
  const corsEnv = readFileSync(join(fundingproRoot, ".env.example"), "utf8");
  const nextConfig = readFileSync(join(fundingproRoot, "next.config.mjs"), "utf8");
  const apiRoute = readFileSync(join(fundingproRoot, "lib/api-route.ts"), "utf8");
  const corsEnforced =
    nextConfig.includes("CORS") ||
    (apiRoute.includes("api-cors") &&
      apiRoute.includes("applyCorsToResponse") &&
      apiRoute.includes("handleCorsPreflight"));
  if (corsEnv.includes("CORS_ALLOWED_ORIGINS") && !corsEnforced) {
    findings.push({
      id: "CORS-UNENFORCED",
      severity: "Medium",
      title: "CORS_ALLOWED_ORIGINS defined but not enforced in Next config",
      remediation: "Add CORS headers middleware or API route checks",
    });
  }

  return { findings };
}
