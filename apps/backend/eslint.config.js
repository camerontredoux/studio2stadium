import { configApp } from "@adonisjs/eslint-config";
export default configApp(
  { ignores: ["database/generated/**"] },
  {
    rules: {
      "prettier/prettier": ["error", { semi: true, singleQuote: false }],
      "@unicorn/filename-case": ["error", { case: "kebabCase" }],
    },
  }
);
