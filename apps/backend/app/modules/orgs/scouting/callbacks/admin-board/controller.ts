import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { AdminCallbackBoardService } from "./service.ts";

export default class AdminCallbackBoardController {
  @inject()
  async handle(ctx: HttpContext, service: AdminCallbackBoardService) {
    const data = await service.execute(ctx.orgEvent!.id);
    return ctx.response.ok(data);
  }
}
