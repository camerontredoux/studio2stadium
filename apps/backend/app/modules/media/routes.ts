import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";
const ReorderMediaController = () => import("./reorder-media/controller.ts");

router
  .group(() => {
    router.put("order", [ReorderMediaController]).openapi({
      summary: "Reorder my media",
      description:
        "Sets the display order of every image and video on the authenticated user's profile",
    });
  })
  .use([middleware.auth(), middleware.profile()])
  .prefix("media")
  .openapi({ tags: ["Media"] });
