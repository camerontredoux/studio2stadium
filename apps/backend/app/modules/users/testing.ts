import type { HttpContext } from "@adonisjs/core/http";

export default class TestController {
  async handle({ response }: HttpContext) {
    return response.ok({
      message: "Test 401",
    });
  }
}
