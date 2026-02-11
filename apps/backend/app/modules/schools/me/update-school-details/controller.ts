import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateSchoolDetailsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const session = ctx.auth.getUserOrFail();

    await service.execute(session.id, payload);

    return ctx.response.noContent();
  }
}
