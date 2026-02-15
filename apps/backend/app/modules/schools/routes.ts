import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetFiltersController = () => import("./get-filters/contoller.ts");
const GetSchoolsController = () => import("./get-schools/controller.ts");
const GetSchoolController = () => import("./get-school/controller.ts");
const GetProfileController = () => import("./me/get-profile/controller.ts");
const UpdateProfileController = () =>
  import("./me/update-profile/controller.ts");
const FollowSchoolController = () => import("./follow/controller.ts");
const UnfollowSchoolController = () => import("./unfollow/controller.ts");
const MetadataController = () => import("./metadata/controller.ts");

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
      .use(middleware.auth());

    router
      .group(() => {
        router.get("", [GetProfileController]).openapi({
          summary: "Get school portfolio",
          description: "Returns the authenticated school's program information",
        });
        router.patch("", [UpdateProfileController]).openapi({
          summary: "Update school portfolio",
          description: "Updates the authenticated school's program information",
        });
      })
      .prefix("profile")
      .use([middleware.auth(), middleware.school()]);

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
      .use(middleware.auth());

    router
      .delete("/:id/follow", [UnfollowSchoolController])
      .openapi({
        summary: "Unfollow a school",
        description: "Unfollows the school's profile using the school ID",
      })
      .use(middleware.auth());

    router
      .get("/:id/metadata", [MetadataController])
      .openapi({
        summary: "Get school metadata",
        description: "Returns the school's metadata",
      })
      .use(middleware.auth());
  })
  .prefix("schools")
  .openapi({ tags: ["Schools"] });
