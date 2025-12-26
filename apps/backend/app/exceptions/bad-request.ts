import { Exception } from "@adonisjs/core/exceptions";
import { type HttpContext } from "@adonisjs/core/http";

export default class BadRequestException extends Exception {
  static status = 400;
  static code = "E_BAD_REQUEST";

  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send({ errors: [{ message: error.message }] });
  }
}
