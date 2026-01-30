import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { filters } from "./filters.ts";

export default class GetFiltersController {
  @inject()
  async handle(ctx: HttpContext) {
    ctx.response.header(
      "Cache-Control",
      "public, max-age=300, s-maxage=86400, stale-while-revalidate=600"
    );

    return ctx.response.ok(filters);
  }
}
