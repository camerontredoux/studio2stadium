import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class ListVideosController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const videos = await service.execute();

    return ctx.response.ok(videos);
  }
}
