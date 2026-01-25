import { Exception } from "@adonisjs/core/exceptions";

export const E_FORBIDDEN = class extends Exception {
  static status = 403;
  static code = "E_FORBIDDEN";
};
