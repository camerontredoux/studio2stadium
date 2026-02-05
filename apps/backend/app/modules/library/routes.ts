import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ListVideosByCategoryController = () =>
  import("./list-videos-by-category/controller.ts");
const ListVideosController = () => import("./list-videos/controller.ts");

router
  .group(() => {
    router.get("", [ListVideosController]).openapi({
      summary: "List tap in videos",
      description: "Returns a list of all tap in videos with their category",
    });

    router.get(":category", [ListVideosByCategoryController]).openapi({
      summary: "List videos by category",
      description:
        "Returns a list of videos by category, paginated with 6 results at a time",
    });
  })
  .use(middleware.auth())
  .prefix("library")
  .openapi({ tags: ["Video Library"] });
