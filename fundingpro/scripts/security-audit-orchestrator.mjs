#!/usr/bin/env node
/**
 * Security audit orchestrator — maps 817 Anthropic Cybersecurity Skills to FundingPro checks.
 * Usage: node scripts/security-audit-orchestrator.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadAllSkills } from "./security-audit/lib/skill-parser.mjs";
import { runStaticChecks } from "./security-audit/checks/static.mjs";
import { runDomainChecks } from "./security-audit/checks/domain.mjs";

const fundingproRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(fundingproRoot, "docs/security-audit");

mkdirSync(outDir, { recursive: true });

console.log("Loading 817 cybersecurity skills...");
const skills = loadAllSkills();
console.log(`  Loaded ${skills.length} skills`);

const statusCounts = {};
for (const s of skills) {
  statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
}
console.log("  Status breakdown:", statusCounts);

console.log("\nRunning static checks...");
const staticResult = runStaticChecks();
console.log(`  Static findings: ${staticResult.findings.length}`);

console.log("Running domain checks (AI, payments, upload)...");
const domainResult = runDomainChecks();
console.log(`  Domain findings: ${domainResult.findings.length}`);

const allFindings = [
  ...staticResult.findings,
  ...domainResult.findings.filter((f) => f.status !== "pass"),
];

const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, Informational: 4 };
allFindings.sort(
  (a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
);

const matrix = {
  generatedAt: new Date().toISOString(),
  project: "FundingPro",
  totalSkills: skills.length,
  statusCounts,
  skills,
};

const findingsDoc = {
  generatedAt: new Date().toISOString(),
  project: "FundingPro",
  totalFindings: allFindings.length,
  bySeverity: {},
  findings: allFindings,
  routeStats: staticResult.stats,
};

for (const f of allFindings) {
  findingsDoc.bySeverity[f.severity] = (findingsDoc.bySeverity[f.severity] ?? 0) + 1;
}

writeFileSync(join(outDir, "skills-matrix.json"), JSON.stringify(matrix, null, 2));
writeFileSync(join(outDir, "findings.json"), JSON.stringify(findingsDoc, null, 2));

console.log(`\nWrote ${outDir}/skills-matrix.json (${skills.length} skills)`);
console.log(`Wrote ${outDir}/findings.json (${allFindings.length} findings)`);
console.log("  By severity:", findingsDoc.bySeverity);

process.exit(
  process.env.SECURITY_AUDIT_STRICT === "1" &&
    allFindings.some((f) => f.severity === "Critical" && f.status !== "remediated" && f.status !== "mitigated")
    ? 1
    : 0
);
