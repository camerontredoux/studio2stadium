import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const UpdateAvatarController = () => import("./update-avatar/controller.ts");
const DeleteAccountController = () => import("./delete-account/controller.ts");
const CheckAvailabilityController = () =>
  import("./check-availability/controller.ts");
const GetAccountController = () => import("./get-account/controller.ts");
const UpdateAccountController = () => import("./update-account/controller.ts");
const GetActivityController = () => import("./get-activity/controller.ts");
const GetMyOrgsController = () => import("./get-my-orgs/controller.ts");
const UnsubscribeController = () => import("./unsubscribe/controller.ts");

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

        router.post("avatar", [UpdateAvatarController]).openapi({
          summary: "Update user avatar",
          description:
            "Updates the image ID for the user's avatar from Cloudflare",
        });

        router.get("me/orgs", [GetMyOrgsController]).openapi({
          summary: "Get my organizations",
          description:
            "Returns the organizations the authenticated user is on an event roster for, including their role and member type for routing to the right dashboard.",
        });
      })
      .use(middleware.auth());

    router
      .get("activity", [GetActivityController])
      .openapi({
        summary: "Get user activity",
        description: "Returns the user's activity",
      })
      .use([middleware.auth(), middleware.profile()]);
  })
  .prefix("users")
  .openapi({ tags: ["Users"] });

// Outside the .prefix("users") group — the URL is baked into already-sent
// emails and into the List-Unsubscribe header, so it must stay at /unsubscribe.
//
// GET renders a confirmation page and never writes to the database — mail
// security scanners and prefetchers GET link targets with no human intent.
// POST performs the actual opt-out: the confirmation page's form submit, or
// a mailbox provider's RFC 8058 one-click.
//
// Deliberately not wrapped in .group().openapi() like the rest of this
// module's routes: these are unauthenticated, mailbox-provider-facing
// endpoints, not part of the app's documented API surface.
router.get("unsubscribe", [UnsubscribeController, "confirm"]);
router.post("unsubscribe", [UnsubscribeController, "handle"]);
