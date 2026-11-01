import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateCheckoutController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);

    const session = await service.execute(payload);

    if (!session.client_secret) {
      throw new E_BAD_REQUEST("Failed to create checkout session");
    }

    return ctx.response.ok({ clientSecret: session.client_secret });
  }
}
