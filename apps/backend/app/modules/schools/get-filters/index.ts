import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { filters } from "./filters.ts";

export default class GetFiltersController {
  @inject()
  async handle(ctx: HttpContext) {
    return ctx.response.ok(filters);
  }
}
