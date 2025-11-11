import { configApp } from "@adonisjs/eslint-config";
export default configApp(
  { ignores: ["prisma/**"] },
  {
    rules: {
      "prettier/prettier": ["error", { semi: true, singleQuote: false }],
    },
  }
);
