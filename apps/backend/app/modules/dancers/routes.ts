import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const GetDancerController = () => import("./get-dancer/controller.ts");
const GetFiltersController = () => import("./get-filters/controller.ts");
const CreateDancerController = () => import("./create-dancer/controller.ts");
const GetFollowingController = () => import("./me/get-following/controller.ts");
const UpdatePortfolioController = () =>
  import("./me/update-portfolio/controller.ts");
const GetFollowersController = () => import("./me/get-followers/controller.ts");
const GetFollowingIdsController = () =>
  import("./me/get-following-ids/controller.ts");
const FavoriteDancerController = () => import("./favorite/controller.ts");
const UnfavoriteDancerController = () => import("./unfavorite/controller.ts");
const GetMetadataController = () =>
  import("./get-dancer-metadata/controller.ts");

router
  .group(() => {
    router
      .post("/", [CreateDancerController])
      .openapi({
        summary: "Create a dancer",
        description:
          "Populate account with personal information to finish dancer signup",
      })
      .use(middleware.auth());

    router.get("/filters", [GetFiltersController]).openapi({
      summary: "Get dancer filters",
      description: "Returns the filters to use when searching for dancers",
    });

    router
      .group(() => {
        router.get("following", [GetFollowingController]).openapi({
          summary: "Get following list",
          description: "Returns the list of school's IDs I'm following",
        });
        router.get("following/ids", [GetFollowingIdsController]).openapi({
          summary: "Get following list IDs",
          description: "Returns the list of school's IDs I'm following",
        });
        router.patch("portfolio", [UpdatePortfolioController]).openapi({
          summary: "Update my portfolio",
          description: "Updates the authenticated dancer's portfolio",
        });
        router.get("followers", [GetFollowersController]).openapi({
          summary: "Get dancer followers",
          description: "Returns the schools that have favorited this dancer.",
        });
      })
      .prefix("me")
      .use([middleware.auth(), middleware.dancer()]);

    router
      .get("/:username", [GetDancerController])
      .openapi({
        summary: "Get a dancer",
        description: "Returns the dancer's public profile",
      })
      .use(middleware.auth());

    router
      .post("/:id/favorite", [FavoriteDancerController])
      .openapi({
        summary: "Favorite a dancer",
        description: "Adds a dancer to the school's favorites list.",
      })
      .use([middleware.auth(), middleware.school(), throttle("favorite")]);

    router
      .delete("/:id/favorite", [UnfavoriteDancerController])
      .openapi({
        summary: "Unfavorite a dancer",
        description: "Removes a dancer from the school's favorites list.",
      })
      .use([middleware.auth(), middleware.school(), throttle("unfavorite")]);

    router
      .get("/:id/metadata", [GetMetadataController])
      .openapi({
        summary: "Get dancer metadata",
        description: "Returns the dancer's metadata",
      })
      .use([middleware.auth(), middleware.school()]);
  })
  .prefix("dancers")
  .openapi({ tags: ["Dancers"] });
