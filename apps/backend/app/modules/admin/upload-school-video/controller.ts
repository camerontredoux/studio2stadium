import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class UploadSchoolVideoController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const method = ctx.request.method();

    if (method === "OPTIONS") {
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

    const username = ctx.request.param("username");
    const uploadLength = ctx.request.header("upload-length");
    const uploadMetadata = ctx.request.header("upload-metadata") || "";

    if (!uploadLength) {
      return ctx.response.badRequest({ error: "Missing Upload-Length header" });
    }

    const result = await service.initiateUpload({
      username,
      uploadLength,
      uploadMetadata,
    });

    if ("error" in result) {
      throw new E_BAD_REQUEST(result.message);
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
