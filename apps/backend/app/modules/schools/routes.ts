import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetFiltersController = () => import("./get-filters/contoller.ts");
const GetSchoolsController = () => import("./get-schools/controller.ts");
const GetSchoolController = () => import("./get-school/controller.ts");
const GetProfileController = () => import("./me/get-profile/controller.ts");
const UpdateProfileController = () =>
  import("./me/update-profile/controller.ts");

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
          summary: "Get school program information",
          description: "Returns the authenticated school's program information",
        });
        router.patch("", [UpdateProfileController]).openapi({
          summary: "Update school program information",
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
  })
  .prefix("schools")
  .openapi({ tags: ["Schools"] });
