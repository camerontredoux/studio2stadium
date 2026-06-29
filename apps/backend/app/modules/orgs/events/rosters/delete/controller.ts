import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DeleteRosterService } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteRosterController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteRosterService) {
    const data = ctx.request.all();
    if (typeof data.ids === "string") {
      data.ids = [data.ids];
    }
    const payload = await schema.validate(data);
    const user = ctx.auth.getUserOrFail();
    const result = await service.execute(ctx.params.id, ctx.org!.id, payload, {
      eventId: ctx.params.id,
      actorId: user.id,
    });
    return ctx.response.ok(result);
  }
}
