import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DancerCallbackDetailService } from "./service.ts";

export default class DancerCallbackDetailController {
  @inject()
  async handle(ctx: HttpContext, service: DancerCallbackDetailService) {
    const dancerRosterId = ctx.params.dancerRosterId as string;
    const rows = await service.execute(ctx.org!.id, dancerRosterId);
    return ctx.response.ok(rows);
  }
}
