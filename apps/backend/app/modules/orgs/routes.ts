import "./events/routes.ts";
import "./scouting/routes.ts";
import router from "@adonisjs/core/services/router";

const GetOrgController = () => import("./get-org/controller.ts");
const RegisterDancerController = () =>
  import("./register-dancer/controller.ts");
const RegisterSchoolController = () =>
  import("./register-school/controller.ts");

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

    router.post("register/school", [RegisterSchoolController]).openapi({
      summary: "School self-registration via invite token",
      description:
        "Consumes a one-time school invite token, creates a school account with profile + membership, and links pending coach roster rows.",
    });
  })
  .prefix("orgs")
  .openapi({ tags: ["Organizations"] });
