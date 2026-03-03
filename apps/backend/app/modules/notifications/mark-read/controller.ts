import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class MarkReadController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();
    const { id } = ctx.params;

    const result = await service.execute(session.id, id);

    if (!result) {
      return ctx.response.notFound({ message: "Notification not found" });
    }

    return ctx.response.ok(result);
  }
}
