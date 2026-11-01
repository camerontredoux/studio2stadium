import router from "@adonisjs/core/services/router";

const GetPublicStatsController = () =>
  import("./get-public-stats/controller.ts");

// Public: the marketing site's homepage shows these counts to unauthenticated
// visitors, so this route is intentionally outside the auth middleware.
router
  .group(() => {
    router.get("public", [GetPublicStatsController]).openapi({
      summary: "Get public platform stats",
      description:
        "Returns the number of dancers and schools on the platform. Cached for 5 minutes.",
    });
  })
  .prefix("stats")
  .openapi({ tags: ["Stats"] });
