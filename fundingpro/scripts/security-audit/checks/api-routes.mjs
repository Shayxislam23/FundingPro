import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const fundingproRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function isMerchantRoute(content, rel) {
  if (content.includes("withUzumMerchant")) return "merchant";
  if (content.includes("validatePaymeBasicAuth")) return "merchant";
  if (rel.includes("/payments/click/")) return "merchant";
  return null;
}

function classifyWrapper(content, rel) {
  if (content.includes("withPublic")) return "withPublic";
  if (content.includes("withPaymentWebhook")) return "withPaymentWebhook";
  if (content.includes("withAdmin")) return "withAdmin";
  if (content.includes("withActiveUser")) return "withActiveUser";
  if (isMerchantRoute(content, rel)) return "merchant";
  return "custom";
}

function extractMethods(content) {
  const methods = [];
  for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
    if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${m}\\b`).test(content)) {
      methods.push(m);
    }
    if (new RegExp(`export\\s+const\\s+${m}\\s*=`).test(content)) {
      methods.push(m);
    }
  }
  return methods.length > 0 ? methods : ["*"];
}

function routePathFromFile(file) {
  const rel = file.replace(fundingproRoot + "/", "");
  const apiPrefix = "app/api/v1/";
  if (!rel.startsWith(apiPrefix)) return rel;
  const withoutPrefix = rel.slice(apiPrefix.length).replace("/route.ts", "");
  return `/api/v1/${withoutPrefix}`;
}

export function scanApiRoutes() {
  const apiRoot = join(fundingproRoot, "app/api/v1");
  const routes = [];

  function walk(dir) {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name === "route.ts") routes.push(p);
    }
  }
  walk(apiRoot);

  return routes
    .map((file) => {
      const content = readFileSync(file, "utf8");
      const rel = file.replace(fundingproRoot + "/", "");
      const wrapper = classifyWrapper(content, rel);
      return {
        file: rel,
        path: routePathFromFile(file),
        methods: extractMethods(content),
        wrapper,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function generateRouteMatrixMarkdown() {
  const routes = scanApiRoutes();
  const lines = [
    "## Full route inventory (64 files)",
    "",
    `Generated from \`app/api/v1/**/route.ts\` — **${routes.length}** route modules.`,
    "",
    "| Method(s) | Path | Wrapper |",
    "|-----------|------|---------|",
  ];

  for (const route of routes) {
    const methods = route.methods.join(", ");
    const wrapper =
      route.wrapper === "merchant" ? "**merchant**" : `\`${route.wrapper}\``;
    lines.push(`| ${methods} | \`${route.path}\` | ${wrapper} |`);
  }

  return lines.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(generateRouteMatrixMarkdown());
}
