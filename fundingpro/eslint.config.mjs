import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: appDir,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const eslintConfig = [
  {
    ignores: ["convex/_generated/**", ".next/**", "node_modules/**"],
  },
  ...compat.extends("next/core-web-vitals", "plugin:@convex-dev/recommended"),
  ...compat.config({
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  }),
];

export default eslintConfig;
