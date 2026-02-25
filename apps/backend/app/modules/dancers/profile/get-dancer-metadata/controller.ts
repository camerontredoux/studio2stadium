import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class GetMetadataController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);

    const metadata = await service.execute(payload, ctx.session.profileId);

    return ctx.response.ok(metadata);
  }
}
