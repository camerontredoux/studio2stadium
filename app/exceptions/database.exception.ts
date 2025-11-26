import { Exception } from "@adonisjs/core/exceptions";
import { HttpContext } from "@adonisjs/core/http";

export default class DatabaseException extends Exception {
  static status = 400;

  async handle(error: this, ctx: HttpContext) {
    ctx.response
      .status(error.status)
      .send({ errors: [{ message: error.message, code: error.code, cause: error.cause }] });
  }
}
