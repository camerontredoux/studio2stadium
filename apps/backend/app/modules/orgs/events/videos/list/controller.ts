import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { ListVideosService } from "./service.ts";

export default class ListVideosController {
  @inject()
  async handle(ctx: HttpContext, service: ListVideosService) {
    const items = await service.execute(ctx.params.id);
    return ctx.response.ok(items);
  }
}
