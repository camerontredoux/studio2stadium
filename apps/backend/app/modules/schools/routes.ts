import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetFiltersController = () => import("./get-filters/contoller.ts");
const ListSchoolsController = () => import("./list-schools/controller.ts");

router
  .group(() => {
    router.get("filters", [GetFiltersController]).openapi({
      summary: "Get school filters",
      description: "Returns the filters to use when searching for schools",
    });

    router
      .get("", [ListSchoolsController])
      .openapi({
        summary: "List schools",
        description: "Returns a list of schools",
      })
      .use(middleware.auth());
  })
  .prefix("schools")
  .openapi({ tags: ["Schools"] });
