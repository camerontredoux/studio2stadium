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
      return ctx.response.notFound({ message: "Org Event not found." });
    }
    return ctx.response.ok(event);
  }
}
