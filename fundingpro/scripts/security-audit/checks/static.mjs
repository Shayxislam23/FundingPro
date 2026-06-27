import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const fundingproRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

export function runStaticChecks() {
  const findings = [];

  // Non-wrapper API routes
  const apiRoot = join(fundingproRoot, "app/api/v1");
  const routeFiles = [];
  function walk(dir) {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name === "route.ts") routeFiles.push(p);
    }
  }
  walk(apiRoot);

  const wrapperPatterns = {
    withPublic: 0,
    withActiveUser: 0,
    withAdmin: 0,
    withPaymentWebhook: 0,
    merchantAuth: 0,
    custom: 0,
  };
  const customRoutes = [];
  const merchantRoutes = [];

  function isMerchantRoute(content, rel) {
    if (content.includes("withUzumMerchant")) return true;
    if (content.includes("validatePaymeBasicAuth")) return true;
    if (rel.includes("/payments/click/")) return true;
    return false;
  }

  for (const file of routeFiles) {
    const content = readFileSync(file, "utf8");
    const rel = file.replace(fundingproRoot + "/", "");
    if (content.includes("withPublic")) wrapperPatterns.withPublic++;
    else if (content.includes("withPaymentWebhook")) wrapperPatterns.withPaymentWebhook++;
    else if (content.includes("withAdmin")) wrapperPatterns.withAdmin++;
    else if (content.includes("withActiveUser")) wrapperPatterns.withActiveUser++;
    else if (isMerchantRoute(content, rel)) {
      wrapperPatterns.merchantAuth++;
      merchantRoutes.push(rel);
    } else {
      wrapperPatterns.custom++;
      customRoutes.push(rel);
    }
  }

  if (customRoutes.length > 0) {
    findings.push({
      id: "API-CUSTOM-AUTH",
      severity: "Medium",
      title: "API routes without standard auth wrappers",
      owasp: "API5:2023 Broken Function Level Authorization",
      details: customRoutes,
      remediation: "Audit each custom route; prefer withPublic/withActiveUser/withAdmin",
    });
  }

  // convex-server — internal mutations require deploy key in production
  const convexServerPath = join(fundingproRoot, "lib/convex-server.ts");
  if (existsSync(convexServerPath)) {
    const convexServer = readFileSync(convexServerPath, "utf8");
    if (convexServer.includes("getConvexAdmin") && !convexServer.includes("CONVEX_DEPLOY_KEY")) {
      findings.push({
        id: "CONVEX-DEPLOY-KEY",
        severity: "Medium",
        title: "Convex admin client should require CONVEX_DEPLOY_KEY for webhooks/audit",
        owasp: "API2:2023 Broken Authentication",
        file: "lib/convex-server.ts",
        remediation: "Set CONVEX_DEPLOY_KEY in production for internal Convex mutations",
      });
    }
  }

  // middleware API bypass — only flag when edge rate limits are absent
  const middleware = readFileSync(join(fundingproRoot, "middleware.ts"), "utf8");
  const hasEdgeRateLimits =
    middleware.includes("isRateLimitedApiRoute") && middleware.includes("applyApiRateLimit");
  if (middleware.includes('pathname.startsWith("/api/")') && !hasEdgeRateLimits) {
    findings.push({
      id: "EDGE-API-BYPASS",
      severity: "Medium",
      title: "Middleware skips all /api/* routes",
      owasp: "A01:2021 Broken Access Control",
      file: "middleware.ts",
      remediation: "Defense in depth: optional API rate-limit or auth at edge",
    });
  }

  // next.config empty
  const nextConfig = readFileSync(join(fundingproRoot, "next.config.mjs"), "utf8");
  if (!nextConfig.includes("X-Frame-Options") && !nextConfig.includes("headers")) {
    findings.push({
      id: "HEADERS-MISSING",
      severity: "Medium",
      title: "No security headers configured in next.config.mjs",
      owasp: "A05:2021 Security Misconfiguration",
      file: "next.config.mjs",
      remediation: "Add CSP, HSTS, X-Frame-Options, Referrer-Policy",
    });
  }

  // ADMIN_BYPASS_DEV — flag only if production bypass is possible
  const adminAccess = readFileSync(join(fundingproRoot, "lib/auth/admin-access.ts"), "utf8");
  if (
    adminAccess.includes("ADMIN_BYPASS_DEV") &&
    !adminAccess.includes('VERCEL_ENV === "production"')
  ) {
    findings.push({
      id: "ADMIN-DEV-BYPASS",
      severity: "High",
      title: "ADMIN_BYPASS_DEV flag exists in admin access logic",
      owasp: "A01:2021 Broken Access Control",
      file: "lib/auth/admin-access.ts",
      remediation: "Ensure never set in production Vercel env",
    });
  }

  // SQL injection — only direct interpolation inside pool.query SQL templates
  const libDb = join(fundingproRoot, "lib/db");
  for (const f of readdirSync(libDb).filter((x) => x.endsWith(".ts"))) {
    const c = readFileSync(join(libDb, f), "utf8");
    const matches = c.match(/pool\.query\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/g);
    if (matches?.some((m) => !/\$\{\s*(?:i|idx|\d+\s*\+)/.test(m) && !/\$\{[^}]*\$\d/.test(m))) {
      const userInput = matches.filter(
        (m) => /\$\{(?:params|input|body|search|req)\./.test(m) && !m.includes("$${")
      );
      if (userInput.length > 0) {
        findings.push({
          id: `SQLI-SUSPECT-${f}`,
          severity: "High",
          title: `Possible SQL string interpolation in lib/db/${f}`,
          owasp: "A03:2021 Injection",
          file: `lib/db/${f}`,
          remediation: "Use parameterized queries only",
        });
      }
    }
  }

  // CI workflow review
  const ciPath = join(fundingproRoot, "../.github/workflows/ci.yml");
  if (existsSync(ciPath)) {
    const ci = readFileSync(ciPath, "utf8");
    if (!ci.includes("gitleaks") && !ci.includes("npm audit")) {
      findings.push({
        id: "CI-NO-SECURITY-SCAN",
        severity: "Medium",
        title: "CI lacks gitleaks and npm audit steps",
        owasp: "A06:2021 Vulnerable Components",
        file: ".github/workflows/ci.yml",
        remediation: "Add secrets scan and dependency audit to CI",
      });
    }
    if (ci.includes("@v4") && !ci.includes("sha256")) {
      findings.push({
        id: "CI-ACTIONS-MUTABLE-TAGS",
        severity: "Low",
        title: "GitHub Actions use mutable version tags (@v4)",
        owasp: "Supply chain",
        file: ".github/workflows/ci.yml",
        remediation: "Pin actions to SHA digests",
      });
    }
  }

  // npm audit
  const audit = spawnSync("npm", ["audit", "--json"], {
    cwd: fundingproRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (audit.stdout) {
    try {
      const data = JSON.parse(audit.stdout);
      const meta = data.metadata?.vulnerabilities ?? {};
      if ((meta.high ?? 0) + (meta.critical ?? 0) > 0) {
        findings.push({
          id: "NPM-AUDIT-HIGH",
          severity: "High",
          title: "npm audit reports high/critical vulnerabilities",
          owasp: "A06:2021 Vulnerable Components",
          details: meta,
          remediation: "Run npm audit fix or update dependencies",
        });
      } else if ((meta.moderate ?? 0) > 0) {
        findings.push({
          id: "NPM-AUDIT-MODERATE",
          severity: "Medium",
          title: "npm audit reports moderate vulnerabilities",
          owasp: "A06:2021 Vulnerable Components",
          details: meta,
          remediation: "Review and update dependencies",
        });
      }
    } catch {
      /* ignore */
    }
  }

  // gitleaks if available
  const gitleaks = spawnSync("gitleaks", ["detect", "--source", fundingproRoot, "--no-git", "-f", "json"], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (gitleaks.status === 0 || gitleaks.stdout) {
    try {
      const leaks = JSON.parse(gitleaks.stdout || "[]");
      const real = Array.isArray(leaks)
        ? leaks.filter((l) => !l.File?.includes(".env.example") && !l.File?.includes("placeholder"))
        : [];
      if (real.length > 0) {
        findings.push({
          id: "SECRETS-GITLEAKS",
          severity: "Critical",
          title: "gitleaks detected potential secrets in codebase",
          owasp: "A02:2021 Cryptographic Failures",
          details: real.slice(0, 10).map((l) => ({ file: l.File, rule: l.RuleID })),
          remediation: "Rotate secrets and add to .gitleaksignore if false positive",
        });
      }
    } catch {
      /* gitleaks not json or not installed */
    }
  }

  return {
    findings,
    stats: { routeFiles: routeFiles.length, wrapperPatterns, customRoutes, merchantRoutes },
  };
}
