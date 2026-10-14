import { GetMediaPermissionsService } from "#modules/media/permissions/service";
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { Service as TusUploadService } from "../tus-upload/service.ts";

export default class GetVideoPermissionsController {
  @inject()
  async handle(
    ctx: HttpContext,
    permissions: GetMediaPermissionsService,
    uploads: TusUploadService
  ) {
    const user = ctx.auth.getUserOrFail();
    const result = await permissions.execute(user.id);

    return ctx.response.ok({
      ...result,
      directVideosRemaining: await uploads.directVideosRemaining(
        user.id,
        result.directVideoLimit
      ),
    });
  }
}
