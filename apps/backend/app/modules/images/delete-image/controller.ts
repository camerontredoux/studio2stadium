import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { DeleteProfileImageService } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteProfileImageController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteProfileImageService) {
    const payload = await ctx.request.validateUsing(schema);

    try {
      await service.execute(payload);
    } catch (e) {
      if (e instanceof Error) {
        throw new E_BAD_REQUEST(e.message);
      }
      throw new E_BAD_REQUEST("Failed to delete file");
    }

    return ctx.response.noContent();
  }
}
