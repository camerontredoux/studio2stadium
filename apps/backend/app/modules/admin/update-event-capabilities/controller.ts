import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateEventCapabilitiesController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    const event = await service.execute(payload, user.id);
    if (!event) {
      throw new E_NOT_FOUND("Org Event not found", {
        code: "E_ORG_EVENT_NOT_FOUND",
      });
    }
    return ctx.response.ok(event);
  }
}
