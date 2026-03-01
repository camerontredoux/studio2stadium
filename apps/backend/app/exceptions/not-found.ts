import { Exception } from "@adonisjs/core/exceptions";

export const E_NOT_FOUND = class extends Exception {
  static status = 404;
  static code = "E_NOT_FOUND";
  meta?: Record<string, unknown>;

  constructor(
    message: string,
    meta?: Record<string, unknown>,
    options: ErrorOptions = {}
  ) {
    super(message, options);
    this.meta = meta;
  }
};
