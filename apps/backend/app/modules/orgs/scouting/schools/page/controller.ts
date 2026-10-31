import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListSchoolsService } from "../list/service.ts";
import { schoolPageSchema } from "./validator.ts";

export default class SchoolPageController {
  @inject()
  async handle(ctx: HttpContext, service: ListSchoolsService) {
    const payload = await ctx.request.validateUsing(schoolPageSchema);
    const result = await service.page(
      ctx.orgEvent!.orgId,
      ctx.orgEvent!.id,
      ctx.orgRoster?.id ?? null,
      payload
    );
    return ctx.response.ok(result);
  }
}
