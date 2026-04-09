import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ListDancersController = () => import("./dancers/list/controller.ts");
const GetDancerById = () => import("./dancers/get-by-id/controller.ts");
const CreateFavorite = () => import("./favorites/create/controller.ts");
const DeleteFavorite = () => import("./favorites/delete/controller.ts");
const ListFavorites = () => import("./favorites/list/controller.ts");

router
  .group(() => {
    router.get(":slug/dancers", [ListDancersController]).openapi({
      summary: "List dancers in active event",
      description: "Coach-scoped dancer search by name or bib number.",
    });
    router.get(":slug/dancers/:rosterId", [GetDancerById]);
    router.get(":slug/favorites", [ListFavorites]);
    router.post(":slug/favorites", [CreateFavorite]);
    router.delete(":slug/favorites/:dancerRosterId", [DeleteFavorite]);
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
