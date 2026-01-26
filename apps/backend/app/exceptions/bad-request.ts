import { Exception } from "@adonisjs/core/exceptions";

export const E_BAD_REQUEST = class extends Exception {
  static status = 400;
  static code = "E_BAD_REQUEST";
  meta?: Record<string, unknown>;

  constructor(
    message: string,
    meta: Record<string, unknown>,
    options: ErrorOptions = {}
  ) {
    super(message, options);
    this.meta = meta;
  }
};
