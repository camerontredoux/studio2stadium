import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { PublishedCallbacksService } from "./service.ts";

export default class PublishedCallbacksController {
  @inject()
  async handle(ctx: HttpContext, service: PublishedCallbacksService) {
    const showcaseId = ctx.params.showcaseId as string;
    const rows = await service.execute(showcaseId);
    return ctx.response.ok(rows);
  }
}
