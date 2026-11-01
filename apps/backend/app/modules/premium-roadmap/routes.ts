import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetRoadmapController = () => import("./get-roadmap/controller.ts");

router
  .group(() => {
    router.get("", [GetRoadmapController]).openapi({
      summary: "Get my Premium Recruiting Roadmap",
      description:
        "Returns the dancer's roadmap steps and records any step completed for the first time. Returns eligible=false for members without paid Premium or when the roadmap is turned off.",
    });
  })
  .use([middleware.auth(), middleware.dancer()])
  .prefix("premium-roadmap")
  .openapi({ tags: ["Premium Roadmap"] });
