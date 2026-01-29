import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { CreateDancerQueries } from "./queries.ts";
import { createDancerValidator } from "./validator.ts";

export default class CreateDancerController {
  @inject()
  async handle(ctx: HttpContext, queries: CreateDancerQueries) {
    const payload = await ctx.request.validateUsing(createDancerValidator);
    const user = ctx.auth.getUserOrFail();

    await queries.createDancer(user.id, payload);

    await ctx.auth.use("redis").refresh();

    return ctx.response.noContent();
  }
}
