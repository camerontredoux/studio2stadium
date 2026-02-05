import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ListVideosController = () => import("./list-videos/controller.ts");

router
  .group(() => {
    router
      .get("", [ListVideosController])
      .openapi({
        summary: "List tap in videos",
        description: "Returns a list of all tap in videos with their category",
      })
      .use(middleware.auth());
  })
  .prefix("library")
  .openapi({ tags: ["Video Library"] });
