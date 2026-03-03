import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteAccountController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const user = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    try {
      await service.execute(user, payload);
      await ctx.auth.use("redis").logout();

      return ctx.response.noContent();
    } catch (err) {
      if (err instanceof Error) {
        throw new E_BAD_REQUEST(err.message, {
          cause: err.message,
          code: "E_DELETE_ACCOUNT_FAILED",
        });
      }
    }

    return ctx.response.badRequest("Failed to delete account");
  }
}
