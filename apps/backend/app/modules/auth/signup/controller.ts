import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { rateLimit } from "#utils/rate-limit";
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class SignupController {
  @inject()
  async handle({ request, response }: HttpContext, service: Service) {
    const payload = await request.validateUsing(validator);

    if (payload.type === "school" && !payload.location) {
      throw new E_BAD_REQUEST("Location is required to make a school account");
    }

    const user = await rateLimit(() => service.execute(payload), {
      key: `signup:${request.ip()}:${payload.email}`,
      requests: 10,
      duration: "1 min",
      blockDuration: "1 min",
      inMemoryBlockDuration: "1 min",
      inMemoryBlockOnConsumed: 11,
    });

    return response.created(user);
  }
}
