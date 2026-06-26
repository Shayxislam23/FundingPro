import { readFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
export const skillsRoot = join(repoRoot, ".agents/skills");

const NA_SUBDOMAINS = new Set([
  "digital-forensics",
  "malware-analysis",
  "ot-ics-security",
  "ot-security",
  "endpoint-security",
  "wireless-security",
  "blockchain-security",
  "hardware-firmware-security",
  "firmware-security",
  "firmware-analysis",
  "deception-technology",
  "purple-team",
  "red-team",
  "offensive-security",
  "mobile-security",
]);

const TOOL_BLOCKED_KEYWORDS = [
  "burpsuite",
  "burp",
  "nessus",
  "nmap",
  "nikto",
  "ghidra",
  "frida",
  "jadx",
  "aircrack",
  "kismet",
  "splunk",
  "wireshark",
  "volatility",
  "metasploit",
  "cobalt-strike",
  "bloodhound",
  "mimikatz",
  "kape",
  "yara-rule-development",
];

const EXECUTED_PREFIXES = [
  "testing-api-",
  "testing-for-broken-access-control",
  "testing-cors-",
  "testing-jwt-",
  "testing-oauth2-",
  "testing-for-json-web-token",
  "testing-for-sensitive-data-exposure",
  "testing-for-xss-",
  "testing-for-open-redirect",
  "testing-for-host-header",
  "testing-for-business-logic",
  "testing-prompt-injection",
  "testing-for-system-prompt-leakage",
  "securing-agentic-ai",
  "implementing-secrets-scanning",
  "implementing-secret-scanning-with-gitleaks",
  "securing-github-actions",
  "implementing-semgrep",
  "integrating-sast",
  "detecting-supply-chain",
  "performing-security-headers-audit",
  "performing-threat-modeling",
  "exploiting-sql-injection",
  "testing-api-for-broken-object-level",
  "testing-api-for-mass-assignment",
  "testing-api-authentication-weaknesses",
  "testing-api-security-with-owasp",
  "securing-serverless-functions",
  "performing-serverless-function-security",
  "scanning-docker-images-with-trivy",
  "prioritizing-vulnerabilities-with-cvss",
  "triaging-vulnerabilities-with-ssvc",
];

const ADAPTED_PREFIXES = [
  "securing-aws-lambda",
  "securing-aws-iam",
  "securing-api-gateway",
  "securing-azure",
  "securing-kubernetes",
  "securing-container-registry",
  "securing-helm",
  "implementing-devsecops",
  "integrating-dast-with-owasp-zap",
  "scanning-iac-and-images",
  "scanning-containers-with-trivy",
  "remediating-s3-bucket",
  "zero-trust-for-saas",
  "zero-trust-in-cloud",
  "conducting-api-security-testing",
  "performing-web-application-penetration",
  "performing-web-application-vulnerability",
  "detecting-broken-object-property",
  "exploiting-broken-function-level",
  "implementing-jwt-signing",
  "performing-directory-traversal",
  "performing-ssrf-vulnerability",
  "performing-csrf-attack",
  "testing-websocket-api",
  "red-teaming-llms",
];

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].replace(/^['"]|['"]$/g, "").trim();
    if (line.startsWith("  - ")) {
      const tag = line.slice(4).trim();
      fm.tags = fm.tags ?? [];
      fm.tags.push(tag);
    }
  }
  return fm;
}

function classifySkill(slug, meta) {
  const subdomain = meta.subdomain ?? "unknown";
  const tags = meta.tags ?? [];
  const name = meta.name ?? slug;

  if (NA_SUBDOMAINS.has(subdomain)) {
    return { status: "N/A", reason: `Subdomain ${subdomain} not applicable to Next.js SaaS stack` };
  }

  for (const kw of TOOL_BLOCKED_KEYWORDS) {
    if (slug.includes(kw)) {
      return { status: "TOOL_BLOCKED", reason: `Requires specialized tool (${kw})` };
    }
  }

  for (const p of EXECUTED_PREFIXES) {
    if (slug.startsWith(p) || slug.includes(p)) {
      return { status: "EXECUTED", reason: "Automated or code-review check mapped to FundingPro" };
    }
  }

  for (const p of ADAPTED_PREFIXES) {
    if (slug.startsWith(p) || slug.includes(p)) {
      return { status: "ADAPTED", reason: "Checklist adapted to Vercel/Convex/Clerk/Next.js stack" };
    }
  }

  const applicableSubdomains = new Set([
    "api-security",
    "web-application-security",
    "identity-access-management",
    "identity-and-access-management",
    "identity-security",
    "devsecops",
    "ai-security",
    "cloud-security",
    "application-security",
    "supply-chain-security",
    "compliance-governance",
    "governance-risk-compliance",
    "privacy-compliance",
    "vulnerability-management",
    "cryptography",
    "container-security",
    "network-security",
    "security-operations",
    "soc-operations",
    "threat-hunting",
    "threat-intelligence",
    "threat-detection",
    "incident-response",
    "ransomware-defense",
    "phishing-defense",
    "zero-trust-architecture",
    "zero-trust",
    "data-protection",
    "penetration-testing",
    "red-teaming",
  ]);

  if (applicableSubdomains.has(subdomain)) {
    return { status: "ADAPTED", reason: `Subdomain ${subdomain} reviewed at category level` };
  }

  return { status: "N/A", reason: `No FundingPro surface for subdomain ${subdomain}` };
}

export function loadAllSkills() {
  const dirs = readdirSync(skillsRoot).filter((d) => {
    try {
      return statSync(join(skillsRoot, d)).isDirectory();
    } catch {
      return false;
    }
  });

  return dirs.map((slug) => {
    const skillPath = join(skillsRoot, slug, "SKILL.md");
    let meta = {};
    try {
      meta = parseFrontmatter(readFileSync(skillPath, "utf8"));
    } catch {
      /* missing */
    }
    const classification = classifySkill(slug, meta);
    return {
      slug,
      name: meta.name ?? slug,
      subdomain: meta.subdomain ?? "unknown",
      tags: meta.tags ?? [],
      ...classification,
    };
  });
}

export { repoRoot };
