import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const GetFiltersController = () => import("./get-filters/contoller.ts");
const GetSchoolsController = () => import("./get-schools/controller.ts");
const GetSchoolController = () => import("./get-school/controller.ts");
const FollowSchoolController = () => import("./follow/controller.ts");
const UnfollowSchoolController = () => import("./unfollow/controller.ts");
const GetMetadataController = () => import("./get-metadata/controller.ts");
const ShowInterestController = () => import("./show-interest/controller.ts");

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
      .use([middleware.auth(), middleware.dancer()]);

    router
      .get("/:username", [GetSchoolController])
      .openapi({
        summary: "Get a school",
        description: "Returns the school's public profile",
      })
      .use(middleware.auth());

    router
      .post("/:id/follow", [FollowSchoolController])
      .openapi({
        summary: "Follow a school",
        description: "Follows the school's profile using the school ID",
      })
      .use([middleware.auth(), middleware.dancer(), throttle("follow")]);

    router
      .delete("/:id/follow", [UnfollowSchoolController])
      .openapi({
        summary: "Unfollow a school",
        description: "Unfollows the school's profile using the school ID",
      })
      .use([middleware.auth(), middleware.dancer(), throttle("unfollow")]);

    router
      .get("/:id/metadata", [GetMetadataController])
      .openapi({
        summary: "Get school metadata",
        description: "Returns the school's metadata",
      })
      .use([middleware.auth(), middleware.dancer()]);

    router
      .post("/:id/interest", [ShowInterestController])
      .openapi({
        summary: "Show interest in a school",
        description:
          "A dancer can show interest in a school up to 3 times. This endpoint will increment the interest count for the school, and send a notification to the school.",
      })
      .use([middleware.auth(), middleware.dancer(), middleware.premium()]);
  })
  .prefix("schools")
  .openapi({ tags: ["Schools"] });
