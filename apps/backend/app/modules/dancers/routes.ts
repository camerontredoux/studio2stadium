import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetFiltersController = () => import("./get-filters/index.ts");
const CreateDancerController = () => import("./create-dancer/index.ts");

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
  })
  .prefix("dancers")
  .openapi({ tags: ["Dancers"] });
