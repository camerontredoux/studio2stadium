import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { PublishedCallbacksService } from "./service.ts";
import { boardPageSchema } from "../../callbacks/board-page-validator.ts";

export default class PublishedCallbacksController {
  @inject()
  async handle(ctx: HttpContext, service: PublishedCallbacksService) {
    const query = await ctx.request.validateUsing(boardPageSchema);
    const result = await service.execute(
      ctx.orgEvent!.id,
      ctx.params.showcaseId as string,
      query
    );
    return ctx.response.ok(result);
  }
}
