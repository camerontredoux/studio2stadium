import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import boundaries from "eslint-plugin-boundaries";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
      boundaries,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        {
          type: "feature",
          pattern: ["features/*"],
          capture: ["featureName"],
          mode: "folder",
        },
        {
          type: "shared",
          pattern: ["components/*", "lib/*", "hooks/*", "utils/*"],
          mode: "folder",
        },
        {
          type: "route",
          pattern: ["routes/*"],
          mode: "folder",
        },
      ],
      "boundaries/ignore": ["**/*.test.*", "**/*.spec.*"],
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ImportDeclaration[source.value='zod'] ImportDefaultSpecifier",
          message: "Use `import { z } from 'zod'` instead.",
        },
      ],
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              // Features can only import from the SAME feature, not other features
              from: ["feature"],
              disallow: ["feature"],
              allow: [["feature", { featureName: "${from.featureName}" }]],
              message:
                "Features cannot import from other features. Import from a shared location instead.",
            },
          ],
        },
      ],
      "import/no-cycle": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Prevent importing from parent barrel within features (avoids circular deps)
    files: ["**/features/**/*.{ts,tsx}"],
    ignores: ["**/features/*/index.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "..",
              message:
                "Don't import from the parent barrel. Import directly from the specific file (e.g., ../api/queries).",
            },
          ],
        },
      ],
    },
  },
]);
