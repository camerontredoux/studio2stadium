import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetFeedController = () => import("./get-feed/controller.ts");

router
  .group(() => {
    router.get("/", [GetFeedController]).openapi({
      summary: "Get feed",
      description: "Returns the feed for the current user",
    });
  })
  .use(middleware.auth())
  .prefix("feed")
  .openapi({ tags: ["Feed"] });
