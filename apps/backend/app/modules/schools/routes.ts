import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const UpdateFavoriteController = () =>
  import("./update-favorite/controller.ts");
const GetFavoritesDataController = () =>
  import("./get-favorites-data/controller.ts");
const GetFiltersController = () => import("./get-school-filters/controller.ts");
const GetSchoolsController = () => import("./get-schools/controller.ts");
const GetSchoolController = () => import("./get-school/controller.ts");
const FollowSchoolController = () => import("./follow/controller.ts");
const UnfollowSchoolController = () => import("./unfollow/controller.ts");
const GetMetadataController = () =>
  import("./get-school-metadata/controller.ts");
const ShowInterestController = () => import("./show-interest/controller.ts");
const GetFollowersController = () => import("./get-followers/controller.ts");
const GetFollowingController = () => import("./get-following/controller.ts");
const GetRecommendedProgramsController = () =>
  import("./get-recommended-programs/controller.ts");

router
  .group(() => {
    router.get("filters", [GetFiltersController]).openapi({
      summary: "Get school filters",
      description: "Returns the filters to use when searching for schools",
    });

    router
      .get("", [GetSchoolsController])
      .openapi({
        summary: "Get schools",
        description: "Returns a list of schools",
      })
      .use([middleware.dancer()]);

    router
      .get("recommended", [GetRecommendedProgramsController])
      .openapi({
        summary: "Get recommended programs",
        description: "Returns a list of recommended programs",
      })
      .use([middleware.dancer()]);

    router
      .group(() => {
        router.get("followers", [GetFollowersController]).openapi({
          summary: "Get school followers",
          description: "Returns the dancers that have followed this school.",
        });
        router.get("following", [GetFollowingController]).openapi({
          summary: "Get following list",
          description: "Returns the list of dancers this school has favorited.",
        });
        router.get("favorites", [GetFavoritesDataController]).openapi({
          summary: "Get favorites data",
          description: "Returns the data for the school's favorites",
        });
        router.patch("favorites/:id", [UpdateFavoriteController]).openapi({
          summary: "Update a favorite",
          description: "Updates a favorite for the school",
        });
      })
      .prefix("me")
      .use([middleware.school()]);

    router.get("/:username", [GetSchoolController]).openapi({
      summary: "Get a school",
      description: "Returns the school's public profile",
    });

    router
      .post("/:id/follow", [FollowSchoolController])
      .openapi({
        summary: "Follow a school",
        description: "Follows the school's profile using the school ID",
      })
      .use([middleware.dancer(), throttle("follow", 60)]);

    router
      .delete("/:id/follow", [UnfollowSchoolController])
      .openapi({
        summary: "Unfollow a school",
        description: "Unfollows the school's profile using the school ID",
      })
      .use([middleware.dancer(), throttle("unfollow", 30)]);

    router
      .get("/:id/metadata", [GetMetadataController])
      .openapi({
        summary: "Get school metadata",
        description: "Returns the school's metadata",
      })
      .use([middleware.dancer()]);

    router
      .post("/:id/interest", [ShowInterestController])
      .openapi({
        summary: "Show interest in a school",
        description:
          "A dancer can show interest in a school up to 3 times. This endpoint will increment the interest count for the school, and send a notification to the school.",
      })
      .use([middleware.dancer(), middleware.subscribed()]);
  })
  .use(middleware.auth())
  .prefix("schools")
  .openapi({ tags: ["Schools"] });
