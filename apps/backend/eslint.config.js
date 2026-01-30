import { configApp } from "@adonisjs/eslint-config";
export default configApp(
  { ignores: ["app/database/generated/*", ".adonisjs/*"] },
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
    rules: {
      "prettier/prettier": ["error", { semi: true, singleQuote: false }],
      "@unicorn/filename-case": ["error", { case: "kebabCase" }],
    },
  }
);
