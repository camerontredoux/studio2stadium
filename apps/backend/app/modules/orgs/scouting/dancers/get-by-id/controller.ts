import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { GetDancerByIdService } from "./service.ts";

export default class GetDancerByIdController {
  @inject()
  async handle(ctx: HttpContext, service: GetDancerByIdService) {
    const rosterId = ctx.params.rosterId as string;
    const result = await service.execute(
      ctx.orgEvent!.id,
      rosterId,
      ctx.orgRoster?.id ?? null
    );
    if (!result) return ctx.response.notFound({ message: "Dancer not found." });
    return ctx.response.ok(result);
  }
}
