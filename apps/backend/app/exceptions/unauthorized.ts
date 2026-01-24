import { Exception } from "@adonisjs/core/exceptions";

export const E_UNAUTHORIZED_ACCESS = class extends Exception {
  static status = 401;
  static code = "E_UNAUTHORIZED_ACCESS";
};
