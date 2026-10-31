import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { DeleteTrackerSectionService } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteTrackerSectionController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteTrackerSectionService) {
    const payload = await ctx.request.validateUsing(schema);

    await service.execute(ctx.session.profileId, payload);

    return ctx.response.noContent();
  }
}
