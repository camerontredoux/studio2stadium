import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetPostsController = () => import("./get-posts/controller.ts");
const GetBlogAttachmentController = () =>
  import("./get-attachment/controller.ts");

router
  .group(() => {
    router.get("/", [GetPostsController]).openapi({
      summary: "Get all posts",
      description: "Returns a list of all blog posts",
    });
  })
  .use(middleware.auth())
  .prefix("blog")
  .openapi({ tags: ["Blog"] });

// Public: downloadable attachments are served to unauthenticated visitors of
// the public blog site, so this route is intentionally outside the auth group.
router
  .group(() => {
    router
      .get("posts/:postId/attachments/:attachmentId", [
        GetBlogAttachmentController,
      ])
      .openapi({
        summary: "Download a blog post attachment",
        description:
          "Streams a post's PDF attachment as a download. Addresses the file by attachment id; the underlying storage key is resolved server-side.",
      });
  })
  .prefix("blog")
  .openapi({ tags: ["Blog"] });
