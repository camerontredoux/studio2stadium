import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { createHash } from "node:crypto";
import { filters } from "./filters.ts";

export default class GetFiltersController {
  @inject()
  async handle(ctx: HttpContext) {
    const filtersHash = createHash("md5")
      .update(JSON.stringify(filters))
      .digest("hex")
      .slice(0, 8);

    ctx.response.header("ETag", filtersHash);
    ctx.response.header(
      "Cache-Control",
      "public, max-age=300, s-maxage=86400, stale-while-revalidate=600"
    );

    if (ctx.request.header("If-None-Match") === filtersHash) {
      return ctx.response.notModified();
    }

    return ctx.response.ok(filters);
  }
}
