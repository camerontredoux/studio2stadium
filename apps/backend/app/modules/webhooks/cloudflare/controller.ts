import { type HttpContext } from "@adonisjs/core/http";
import { handleStreamWebhook, type StreamWebhookPayload } from "./handlers.ts";

export default class CloudflareController {
  async handle(ctx: HttpContext) {
    const payload = ctx.request.body() as StreamWebhookPayload;

    await handleStreamWebhook(payload);

    return ctx.response.ok({ received: true });
  }
}
