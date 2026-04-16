import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";
import { mergeSchema } from "./validator.ts";

export default class ManualMergeController {
  @inject()
  async handle(
    { request, params, auth, response }: HttpContext,
    service: ReconciliationService
  ) {
    const user = await auth.authenticate();
    const payload = await request.validateUsing(mergeSchema);
    const result = await service.manualMerge(
      params.id,
      params.rosterId,
      payload.targetUserId,
      user.id
    );
    if ("notFound" in result) {
      return response.notFound({
        message: "Roster row not found or already claimed.",
      });
    }
    return response.ok({ merged: true });
  }
}
