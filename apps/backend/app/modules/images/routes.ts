import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";
const DeleteProfileImageController = () =>
  import("./delete-image/controller.ts");
const UploadProfileImageController = () =>
  import("./upload-profile-image/controller.ts");
const UploadImageController = () => import("./upload-image/controller.ts");

router
  .group(() => {
    router
      .post("presign", [UploadImageController])
      .openapi({
        summary: "Request one-time upload URL",
        description:
          "Makes a request to Cloudflare to create a one-time signed upload URL for the user's image",
      })
      .use(throttle("image-upload", 10));

    router.delete(":key", [DeleteProfileImageController]).openapi({
      summary: "Delete an image",
      description: "Deletes an image from the user's profile and feed",
    });

    router
      .post("", [UploadProfileImageController])
      .openapi({
        summary: "Upload media to user's profile",
        description:
          "Posts an image to the user's profile and adds it to their followers' feeds",
      })
      .use(throttle("profile-image-upload", 10));
  })
  .use(middleware.auth())
  .prefix("images")
  .openapi({ tags: ["Images"] });
