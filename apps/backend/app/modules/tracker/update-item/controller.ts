import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import {
  AlreadyCommittedError,
  AlreadyTrackingSchoolError,
} from "../stages.ts";
import { UpdateTrackerItemService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateTrackerItemController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateTrackerItemService) {
    const payload = await ctx.request.validateUsing(schema);

    try {
      const item = await service.execute(ctx.session.profileId, payload);
      if (!item) {
        return ctx.response.notFound({ message: "Tracker item not found" });
      }
      return ctx.response.ok(item);
    } catch (error) {
      if (
        error instanceof AlreadyTrackingSchoolError ||
        error instanceof AlreadyCommittedError
      ) {
        return ctx.response.conflict({
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }
}
