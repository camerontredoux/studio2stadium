import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { ListVideoCategoriesService } from "./service.ts";

export default class ListVideoCategoriesController {
  @inject()
  async handle(ctx: HttpContext, service: ListVideoCategoriesService) {
    const items = await service.execute(ctx.params.id);
    return ctx.response.ok(items);
  }
}
