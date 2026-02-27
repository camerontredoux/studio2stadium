import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UpdateReferenceService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateReferenceController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateReferenceService) {
    const payload = await ctx.request.validateUsing(schema);

    await service.execute(payload);

    return ctx.response.noContent();
  }
}
