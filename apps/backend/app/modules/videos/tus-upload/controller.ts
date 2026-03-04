import { E_FORBIDDEN } from "#exceptions/forbidden";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class TusUploadController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const method = ctx.request.method();

    if (method === "OPTIONS") {
      return this.handleOptions(ctx);
    }

    return this.handlePost(ctx, service);
  }

  private handleOptions(ctx: HttpContext) {
    ctx.response.header("Tus-Resumable", "1.0.0");
    ctx.response.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Upload-Length, Upload-Metadata, Tus-Resumable, Upload-Creator"
    );
    ctx.response.header(
      "Access-Control-Expose-Headers",
      "Location, Tus-Resumable, stream-media-id"
    );
    return ctx.response.noContent();
  }

  private async handlePost(ctx: HttpContext, service: Service) {
    const user = ctx.auth.getUserOrFail();

    const uploadLength = ctx.request.header("upload-length");
    const uploadMetadata = ctx.request.header("upload-metadata") || "";

    if (!uploadLength) {
      return ctx.response.badRequest({ error: "Missing Upload-Length header" });
    }

    const result = await service.initiateUpload({
      userId: user.id,
      uploadLength,
      uploadMetadata,
    });

    if ("error" in result) {
      throw new E_FORBIDDEN(result.message);
    }

    ctx.response.header("Location", result.location);
    ctx.response.header("Tus-Resumable", "1.0.0");
    ctx.response.header("stream-media-id", result.streamMediaId);
    ctx.response.header(
      "Access-Control-Expose-Headers",
      "Location, Tus-Resumable, stream-media-id"
    );

    return ctx.response.created({});
  }
}
