import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import {
  AlreadyTrackingSchoolError,
  CreateTrackerItemService,
} from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateTrackerItemController {
  @inject()
  async handle(ctx: HttpContext, service: CreateTrackerItemService) {
    const payload = await ctx.request.validateUsing(schema);

    try {
      const item = await service.execute(ctx.session.profileId, payload);
      return ctx.response.created(item);
    } catch (error) {
      if (error instanceof AlreadyTrackingSchoolError) {
        return ctx.response.conflict({
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }
}
