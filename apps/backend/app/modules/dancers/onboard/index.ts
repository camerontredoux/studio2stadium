import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { OnboardQueries } from "./queries.ts";
import { onboardValidator } from "./validator.ts";

export default class OnboardController {
  @inject()
  async handle(ctx: HttpContext, queries: OnboardQueries) {
    const payload = await ctx.request.validateUsing(onboardValidator);
    const user = ctx.auth.getUserOrFail();

    await queries.createDancer(user.id, payload);

    await ctx.auth.use("redis").refresh();

    return ctx.response.noContent();
  }
}
