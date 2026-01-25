import { Exception } from "@adonisjs/core/exceptions";
import { type HttpContext, ExceptionHandler } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import { errors } from "@adonisjs/limiter";
import { ValidationError } from "@vinejs/vine";
import { type SimpleError } from "@vinejs/vine/types";

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction;

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof errors.ThrottleException) {
      return ctx.response.status(error.status).send({
        message: error.message,
        code: error.code,
        status: error.status,
        retryAfter: error.response.availableIn,
      });
    }
    if (error instanceof ValidationError) {
      return ctx.response.status(error.status).send({
        message: error.message,
        code: error.code,
        status: error.status,
        errors: error.messages.map((message: SimpleError) => ({
          field: message.field,
          message: message.message,
        })),
      });
    }
    if (error instanceof Exception) {
      return ctx.response.status(error.status).send({
        message: error.message,
        code: error.code,
        status: error.status,
      });
    }
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx);
  }
}
