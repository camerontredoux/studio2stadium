import "./events/routes.ts";
import router from "@adonisjs/core/services/router";

const GetOrgController = () => import("./get-org/controller.ts");
const RegisterDancerController = () =>
  import("./register-dancer/controller.ts");

router
  .group(() => {
    router.get(":slug", [GetOrgController]).openapi({
      summary: "Get organization",
      description:
        "Public org metadata + branding for the login and landing pages.",
    });

    router.post(":slug/register", [RegisterDancerController]).openapi({
      summary: "Dancer self-registration via invite token",
      description:
        "Consumes a one-time invite token and creates a new dancer account with an org membership and a time-limited premium grant.",
    });
  })
  .prefix("orgs")
  .openapi({ tags: ["Organizations"] });
