import "./events/routes.ts";
import "./scouting/routes.ts";
import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetOrgController = () => import("./get-org/controller.ts");
const ListOrgsController = () => import("./list-orgs/controller.ts");
const RegisterDancerController = () =>
  import("./register-dancer/controller.ts");
const RegisterSchoolController = () =>
  import("./register-school/controller.ts");
const InviteLookupSchoolController = () =>
  import("./invite-lookup-school/controller.ts");
const InviteLookupDancerController = () =>
  import("./invite-lookup-dancer/controller.ts");
const UpdateOrgSettingsController = () =>
  import("./update-settings/controller.ts");

router
  .group(() => {
    router.get("/", [ListOrgsController]).openapi({
      summary: "List organizations",
      description:
        "Public directory of organizations for org-specific login pages.",
    });

    router.get(":slug", [GetOrgController]).openapi({
      summary: "Get organization",
      description:
        "Public org metadata + branding for the login and landing pages.",
    });

    router
      .patch(":slug/settings", [UpdateOrgSettingsController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);

    router.post(":slug/register", [RegisterDancerController]).openapi({
      summary: "Dancer self-registration via invite token",
      description:
        "Consumes a one-time invite token and creates a new dancer account with an org membership and a time-limited premium grant.",
    });

    router.post("register/school", [RegisterSchoolController]).openapi({
      summary: "School self-registration via invite token",
      description:
        "Consumes a one-time school invite token, creates a school account with profile + membership, and links pending coach roster rows.",
    });

    router
      .get("invites/school/:token", [InviteLookupSchoolController])
      .openapi({
        summary: "Look up a school invite by token",
        description:
          "Returns the invite state (valid | consumed | expired | invalid) plus prefill data (email, organization, event/org names, brand color) when valid, so the school register page can show the right message. Always 200.",
      });

    router
      .get(":slug/invites/dancer/:token", [InviteLookupDancerController])
      .openapi({
        summary: "Look up a dancer invite by token",
        description:
          "Returns the invite state (valid | consumed | expired | invalid) plus prefill data (email, org name, brand color) when valid, so the dancer register page can show the right message. Always 200.",
      });
  })
  .prefix("orgs")
  .openapi({ tags: ["Organizations"] });
