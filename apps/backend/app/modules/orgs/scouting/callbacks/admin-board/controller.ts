import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { AdminCallbackBoardService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../../showcases/ensure-active/service.ts";

export default class AdminCallbackBoardController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: AdminCallbackBoardService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    const showcase = await ensureShowcase.execute(ctx.orgEvent!.id);
    const data = await service.execute(ctx.orgEvent!.id, showcase.id);
    return ctx.response.ok({ ...data, showcase });
  }
}
