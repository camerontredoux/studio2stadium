import { configApp } from "@adonisjs/eslint-config";
export default configApp(
  { ignores: ["app/database/generated/*", ".adonisjs/*"] },
  {
    rules: {
      "prettier/prettier": ["error", { semi: true, singleQuote: false }],
      "@unicorn/filename-case": ["error", { case: "kebabCase" }],
    },
  }
);
