import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class UploadProfileVideoController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const user = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    await service.execute(
      {
        id: user.id,
        type: user.type,
        profileId: ctx.session.profileId,
      },
      payload
    );

    return ctx.response.noContent();
  }
}
