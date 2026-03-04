import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import env from "#start/env";
import { createHmac, timingSafeEqual } from "node:crypto";

export default class VerifyCloudflareWebhookMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const webhookSecret = env.get("CLOUDFLARE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      ctx.logger.error("Cloudflare webhook secret is not configured");
      return ctx.response.badRequest({
        error: "Webhook secret not configured",
      });
    }

    const signature = ctx.request.header("webhook-signature");

    if (!signature) {
      return ctx.response.badRequest({
        error: "Missing Webhook-Signature header",
      });
    }

    const rawBody = ctx.request.raw();

    if (!rawBody) {
      return ctx.response.badRequest({ error: "Missing request body" });
    }

    try {
      // Parse signature: time=...,sig1=...
      const parts = signature.split(",");
      const timePart = parts.find((p) => p.startsWith("time="));
      const sigPart = parts.find((p) => p.startsWith("sig1="));

      if (!timePart || !sigPart) {
        return ctx.response.badRequest({
          error: "Invalid signature format",
        });
      }

      const timestamp = timePart.split("=")[1];
      const providedSig = sigPart.split("=")[1];

      // Compute expected signature
      const payload = `${timestamp}.${rawBody}`;
      const expectedSig = createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");

      // Timing-safe comparison
      const providedBuffer = Buffer.from(providedSig, "hex");
      const expectedBuffer = Buffer.from(expectedSig, "hex");

      if (
        providedBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(providedBuffer, expectedBuffer)
      ) {
        ctx.logger.error("Cloudflare webhook signature verification failed");
        return ctx.response.badRequest({ error: "Invalid signature" });
      }

      // Store parsed body for handler
      ctx.request.updateBody(JSON.parse(rawBody));
    } catch (error) {
      ctx.logger.error(
        { err: error },
        "Cloudflare webhook signature verification failed"
      );
      return ctx.response.badRequest({ error: "Invalid signature" });
    }

    return next();
  }
}
