import router from "@adonisjs/core/services/router";

const GetOrgController = () => import("./get-org/controller.ts");

router
  .group(() => {
    router.get(":slug", [GetOrgController]).openapi({
      summary: "Get organization",
      description:
        "Public org metadata + branding for the login and landing pages.",
    });
  })
  .prefix("orgs")
  .openapi({ tags: ["Organizations"] });
