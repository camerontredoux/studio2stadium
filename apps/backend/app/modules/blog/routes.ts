import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetPostsController = () => import("./get-posts/controller.ts");

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
