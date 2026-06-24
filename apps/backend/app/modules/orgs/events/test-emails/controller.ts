import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { TestEmailsService } from "./service.ts";
import { schema } from "./validator.ts";

export default class TestEmailsController {
  @inject()
  async handle(ctx: HttpContext, service: TestEmailsService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    const org = ctx.org;
    if (!org) {
      throw new E_NOT_FOUND("Organization not found.");
    }

    const result = await service.execute(org, payload, {
      email: user.displayEmail,
      firstName: user.firstName,
    });

    return ctx.response.ok(result);
  }
}
