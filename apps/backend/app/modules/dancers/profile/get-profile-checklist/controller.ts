import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetChecklistController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const checklist = await service.execute(ctx.session.profileId);

    if (!checklist) {
      return ctx.response.notFound("Checklist not found");
    }

    return ctx.response.ok(checklist);
  }
}
