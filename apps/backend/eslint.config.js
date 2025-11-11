import { configApp } from "@adonisjs/eslint-config";
export default configApp({
  rules: {
    "prettier/prettier": ["error", { semi: true, singleQuote: false }],
  },
});
