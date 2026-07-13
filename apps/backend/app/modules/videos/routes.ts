import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const DeleteProfileVideoController = () =>
  import("./delete-video/controller.ts");
const TusUploadController = () => import("./tus-upload/controller.ts");
const AddYoutubeVideoController = () =>
  import("./add-youtube-video/controller.ts");

router
  .group(() => {
    router
      .delete(":id", [DeleteProfileVideoController])
      .openapi({
        summary: "Delete a video",
        description: "Deletes a video from the user's profile and feed",
      })
      .use(middleware.profile());

    router
      .post("tus", [TusUploadController])
      .openapi({
        summary: "Initiate TUS video upload",
        description: "Initiates a TUS resumable upload to Cloudflare Stream",
      })
      .use(throttle("video-upload", 10));

    router
      .post("youtube", [AddYoutubeVideoController])
      .openapi({
        summary: "Add YouTube video",
        description: "Add a YouTube video to the user's profile",
      })
      .use(middleware.profile());
  })
  .use(middleware.auth())
  .prefix("videos")
  .openapi({ tags: ["Videos"] });
