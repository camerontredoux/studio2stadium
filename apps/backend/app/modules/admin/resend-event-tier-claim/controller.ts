import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { NotAwaitingClaimError, Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class ResendEventTierClaimController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);

    let sent: boolean;
    try {
      sent = await service.execute(payload);
    } catch (err) {
      if (err instanceof NotAwaitingClaimError) {
        return ctx.response.conflict({ message: err.message });
      }
      throw err;
    }

    if (!sent) throw new E_NOT_FOUND("Purchase not found");

    return ctx.response.noContent();
  }
}
