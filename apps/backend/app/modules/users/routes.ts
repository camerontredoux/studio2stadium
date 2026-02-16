import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const DeleteAccountController = () => import("./delete-account/controller.ts");
const CheckAvailabilityController = () =>
  import("./check-availability/controller.ts");
const GetAccountController = () => import("./get-account/controller.ts");
const UpdateAccountController = () => import("./update-account/controller.ts");
const GetActivityController = () => import("./get-activity/controller.ts");

router
  .group(() => {
    router
      .get("check-availability", [CheckAvailabilityController])
      .openapi({
        summary: "Check username availability",
        description: "Checks if a username is available for registration.",
      })
      .use(throttle("check-availability", 20));

    router
      .group(() => {
        router.get("account", [GetAccountController]).openapi({
          summary: "Get account settings",
          description: "Returns the user's account settings",
        });

        router.patch("account", [UpdateAccountController]).openapi({
          summary: "Update account settings",
          description: "Updates the user's account settings",
        });

        router.delete("account", [DeleteAccountController]).openapi({
          summary: "Delete account",
          description: "Deletes the user's account",
        });
      })
      .use(middleware.auth());

    router
      .get("activity", [GetActivityController])
      .openapi({
        summary: "Get user activity",
        description: "Returns the user's activity",
      })
      .use(middleware.auth());
  })
  .prefix("users")
  .openapi({ tags: ["Users"] });
