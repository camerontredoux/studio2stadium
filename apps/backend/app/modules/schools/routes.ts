import router from "@adonisjs/core/services/router";

const GetFiltersController = () => import("./get-filters/index.ts");

router
  .group(() => {
    router.get("/filters", [GetFiltersController]).openapi({
      summary: "Get school filters",
      description: "Returns the filters to use when searching for schools",
    });
  })
  .prefix("schools")
  .openapi({ tags: ["Schools"] });
