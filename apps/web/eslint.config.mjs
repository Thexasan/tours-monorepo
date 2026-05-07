import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { monorepoIgnores, monorepoStyleRules } from "../../eslint.base.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "next-i18next.config.js",
    ...monorepoIgnores,
  ]),
  {
    rules: monorepoStyleRules,
  },
]);

export default eslintConfig;
