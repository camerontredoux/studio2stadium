import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import drive from "@adonisjs/drive/services/main";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

/** Build a Content-Disposition value that survives non-ASCII filenames. */
function contentDisposition(name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(name);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export default class GetBlogAttachmentController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const attachment = await service.execute(payload);

    if (!attachment) {
      throw new E_NOT_FOUND("Attachment not found.");
    }

    const disk = drive.use("r2");
    if (!(await disk.exists(attachment.key))) {
      throw new E_NOT_FOUND("Attachment file is no longer available.");
    }

    const filename = attachment.name.toLowerCase().endsWith(".pdf")
      ? attachment.name
      : `${attachment.name}.pdf`;

    ctx.response.header("Content-Type", attachment.contentType);
    ctx.response.header("Content-Length", String(attachment.size));
    ctx.response.header("Content-Disposition", contentDisposition(filename));

    const stream = await disk.getStream(attachment.key);
    return ctx.response.stream(stream);
  }
}
