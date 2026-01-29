import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const CheckAvailabilityController = () =>
  import("./check-availability/index.ts");
const GetFiltersController = () => import("./get-filters/index.ts");

router
  .group(() => {
    router
      .get("/check-availability", [CheckAvailabilityController])
      .openapi({
        summary: "Check username availability",
        description: "Checks if a username is available for registration.",
      })
      .use([throttle("username-available", "memory")]);

    router.get("/filters", [GetFiltersController]).openapi({
      summary: "Get explore filters",
      description:
        "Returns the filters to use when searching for users (requires type)",
    });
  })
  .prefix("users")
  .openapi({ tags: ["Users"] });
