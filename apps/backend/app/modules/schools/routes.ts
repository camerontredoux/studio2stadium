import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetFiltersController = () => import("./get-filters/contoller.ts");
const GetSchoolsController = () => import("./get-schools/controller.ts");
const GetSchoolController = () => import("./get-school/controller.ts");
const GetSchoolProfileController = () =>
  import("#modules/schools/me/get-profile/controller");
const GetProgramInfoController = () =>
  import("./me/get-program-info/controller.ts");
const UpdateProgramInfoController = () =>
  import("./me/update-program-info/controller.ts");
const GetSchoolDetailsController = () =>
  import("./me/get-school-details/controller.ts");
const UpdateSchoolDetailsController = () =>
  import("./me/update-school-details/controller.ts");
const UpdateSchoolProfileController = () =>
  import("#modules/schools/me/update-profile/controller");

router
  .group(() => {
    router.get("filters", [GetFiltersController]).openapi({
      summary: "Get school filters",
      description: "Returns the filters to use when searching for schools",
    });

    router
      .get("/", [GetSchoolsController])
      .openapi({
        summary: "Get schools",
        description: "Returns a list of schools",
      })
      .use(middleware.auth());

    router
      .group(() => {
        router.get("program-info", [GetProgramInfoController]).openapi({
          summary: "Get my program info",
          description: "Returns the authenticated school's program information",
        });
        router.patch("program-info", [UpdateProgramInfoController]).openapi({
          summary: "Update my program info",
          description: "Updates the authenticated school's program information",
        });
        router.get("school-details", [GetSchoolDetailsController]).openapi({
          summary: "Get my school details",
          description: "Returns the authenticated school's details",
        });
        router
          .patch("school-details", [UpdateSchoolDetailsController])
          .openapi({
            summary: "Update my school details",
            description: "Updates the authenticated school's details",
          });
        router.get("profile", [GetSchoolProfileController]).openapi({
          summary: "Get my school profile",
          description: "Returns the authenticated school's profile",
        });
        router.patch("profile", [UpdateSchoolProfileController]).openapi({
          summary: "Update my school profile",
          description: "Updates the authenticated school's profile",
        });
      })
      .prefix("me")
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
