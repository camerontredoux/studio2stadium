import { Exception } from "@adonisjs/core/exceptions";

export const E_INVALID_CREDENTIALS = class extends Exception {
  static status = 400;
  static code = "E_INVALID_CREDENTIALS";
};
