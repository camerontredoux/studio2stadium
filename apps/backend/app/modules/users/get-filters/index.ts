import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { GetFiltersService } from "./service.ts";
import { getFiltersValidator } from "./validator.ts";

export default class GetFiltersController {
  @inject()
  async handle(ctx: HttpContext, service: GetFiltersService) {
    const payload = await ctx.request.validateUsing(getFiltersValidator);

    const filters = await service.execute(payload);

    return ctx.response.ok(filters);
  }
}
