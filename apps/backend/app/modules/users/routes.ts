import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const CheckAvailabilityController = () =>
  import("./check-availability/controller.ts");
const GetGeneralController = () => import("./get-general/controller.ts");
const UpdateGeneralController = () => import("./update-general/controller.ts");

router
  .group(() => {
    router
      .get("/check-availability", [CheckAvailabilityController])
      .openapi({
        summary: "Check username availability",
        description: "Checks if a username is available for registration.",
      })
      .use([throttle("username-available", "memory")]);

    router
      .group(() => {
        router.get("general", [GetGeneralController]).openapi({
          summary: "Get general settings",
          description: "Returns the user's general account settings",
        });

        router.patch("general", [UpdateGeneralController]).openapi({
          summary: "Update general settings",
          description: "Updates the user's general account settings",
        });
      })
      .use(middleware.auth());
  })
  .prefix("users")
  .openapi({ tags: ["Users"] });
