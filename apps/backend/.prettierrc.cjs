const adonisjsPrettierConfig = require("@adonisjs/prettier-config");

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  ...adonisjsPrettierConfig,
  trailingComma: "es5",
  semi: true,
  singleQuote: false,
  printWidth: 80,
};

module.exports = config;
