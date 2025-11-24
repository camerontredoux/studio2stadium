import { Exception } from "@adonisjs/core/exceptions";
import { HttpContext } from "@adonisjs/core/http";

export default class ForbiddenException extends Exception {
  static status = 403;
  static code = "E_FORBIDDEN";

  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send({ errors: [{ message: error.message }] });
  }
}
