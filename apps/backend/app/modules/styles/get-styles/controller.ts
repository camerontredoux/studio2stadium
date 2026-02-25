import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetStylesController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const styles = await service.execute();

    return ctx.response.ok(styles);
  }
}
