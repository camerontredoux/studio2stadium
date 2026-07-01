import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "../get-school/service.ts";
import { schema } from "../get-school/validator.ts";

export default class EventAccessController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();
    const { params } = await ctx.request.validateUsing(schema);

    const eventAccess = session.orgAccountTier
      ? await service.hasEventAccess(session.id, params.username)
      : false;

    return ctx.response.ok({ eventAccess });
  }
}
