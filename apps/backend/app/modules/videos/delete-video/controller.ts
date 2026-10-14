import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { DeleteProfileVideoService } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteProfileVideoController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteProfileVideoService) {
    const payload = await ctx.request.validateUsing(schema);

    try {
      await service.execute(ctx.auth.user!.id, payload);
    } catch (e) {
      if (e instanceof E_NOT_FOUND) {
        throw e;
      }
      if (e instanceof Error) {
        throw new E_BAD_REQUEST(e.message);
      }
      throw new E_BAD_REQUEST("Failed to delete video");
    }

    return ctx.response.noContent();
  }
}
