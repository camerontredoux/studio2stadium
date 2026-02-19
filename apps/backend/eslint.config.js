import { configApp } from "@adonisjs/eslint-config";
export default configApp(
  { ignores: ["app/database/generated/*", ".adonisjs/*", "scratch/*"] },
  {
    rules: {
      "prettier/prettier": ["error", { semi: true, singleQuote: false }],
      "@unicorn/filename-case": ["error", { case: "kebabCase" }],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": [
        "error",
        {
          ignoreTypeValueShadow: true,
          ignoreFunctionTypeParameterNameValueShadow: true,
          allow: ["err", "error", "resolve", "reject", "_", "db"],
        },
      ],
    },
  }
);
