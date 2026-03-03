import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const UploadProfileVideoController = () =>
  import("./upload-profile-video/controller.ts");

router
  .group(() => {
    router
      .post("", [UploadProfileVideoController])
      .openapi({
        summary: "Upload video to profile",
        description: "Posts a video to the user's profile",
      })
      .use(throttle("video-upload", 10));
  })
  .use(middleware.auth())
  .prefix("videos")
  .openapi({ tags: ["Videos"] });
