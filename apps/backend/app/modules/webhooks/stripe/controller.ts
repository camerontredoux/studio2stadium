import { type HttpContext } from "@adonisjs/core/http";

export default class StripeController {
  async handle(ctx: HttpContext) {
    return ctx.response.ok({ received: true });
  }
}
