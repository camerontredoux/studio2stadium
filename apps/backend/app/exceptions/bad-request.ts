import { Exception } from "@adonisjs/core/exceptions";

export const E_BAD_REQUEST = class extends Exception {
  static status = 400;
  static code = "E_BAD_REQUEST";
};
