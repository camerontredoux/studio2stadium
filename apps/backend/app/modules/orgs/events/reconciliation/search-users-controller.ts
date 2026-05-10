import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";

export default class SearchSchoolUsersController {
  @inject()
  async handle(
    { request, response }: HttpContext,
    service: ReconciliationService
  ) {
    const q = request.input("q", "") as string;
    const results = await service.searchSchoolUsers(q);
    return response.ok(results);
  }
}
