import { Exception } from "@adonisjs/core/exceptions";

export const E_DATABASE_ERROR = class extends Exception {
  static status = 400;
  static code = "E_DATABASE_ERROR";
};
