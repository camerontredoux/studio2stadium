import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";

export default class ListReconciliationController {
  @inject()
  async handle(
    { params, response }: HttpContext,
    service: ReconciliationService
  ) {
    const result = await service.listUnclaimed(params.id);
    return response.ok(result);
  }
}
