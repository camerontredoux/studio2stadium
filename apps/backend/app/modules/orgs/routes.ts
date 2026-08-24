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
const CreateRosterClaimController = () =>
  import("./roster-claims/create/controller.ts");
const ListRosterClaimsController = () =>
  import("./roster-claims/list/controller.ts");
const ResolveRosterClaimController = () =>
  import("./roster-claims/resolve/controller.ts");

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

    // Deliberately gated on auth + org only. The dancer making this request
    // has no membership — that absence is the entire reason she is here — so
    // orgMember() would reject exactly the people the flow exists for.
    router
      .post(":slug/roster-claims", [CreateRosterClaimController])
      .use([middleware.auth(), middleware.org()])
      .openapi({
        summary: "Claim a roster entry",
        description:
          "Lets a dancer who cannot find her registration ask the organization to link her account to a roster entry. Creates a pending request for an org admin to resolve; it never links anything on its own. Re-submitting updates the open request rather than creating another.",
      });

    router
      .get(":slug/admin/roster-claims", [ListRosterClaimsController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ])
      .openapi({
        summary: "List roster claim requests",
        description:
          "Pending (default), approved or rejected claims for the organization.",
      });

    router
      .post(":slug/admin/roster-claims/:claimId/resolve", [
        ResolveRosterClaimController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ])
      .openapi({
        summary: "Resolve a roster claim request",
        description:
          "Approve a claim against a chosen roster entry, or reject it. Approving performs the same audited reassignment as attaching an account by hand.",
      });

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
