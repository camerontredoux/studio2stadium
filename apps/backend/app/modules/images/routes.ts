import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";
const UploadImageController = () => import("./upload-image/controller.ts");

router
  .group(() => {
    router
      .post("", [UploadImageController])
      .openapi({
        summary: "Request one-time upload URL",
        description:
          "Makes a request to Cloudflare to create a one-time signed upload URL for the user's image",
      })
      .use(throttle("image-upload", 10));
  })
  .use(middleware.auth())
  .prefix("images")
  .openapi({ tags: ["Images"] });
