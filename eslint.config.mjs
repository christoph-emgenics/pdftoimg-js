import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  // Global ignores (matches .gitignore)
  {
    ignores: [
      "node_modules/**",
      "bin/**",
      "dist/**",
      "output/**",
      ".tsup/**",
      "src/bin/**",
      ".yarn/**",
      ".pnp.*",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "out/**",
      "legacy-out/**",
      "examples/**",
      "fixtures/**",
      "tests/browser/dist/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: {
      js,
    },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    extends: [tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
