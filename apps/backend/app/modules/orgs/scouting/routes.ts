import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ListDancersController = () => import("./dancers/list/controller.ts");

router
  .group(() => {
    router.get(":slug/dancers", [ListDancersController]).openapi({
      summary: "List dancers in active event",
      description: "Coach-scoped dancer search by name or bib number.",
    });
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgCoach(),
  ])
  .openapi({ tags: ["Org Scouting"] });
