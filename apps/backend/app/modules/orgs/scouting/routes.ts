import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ListDancersController = () => import("./dancers/list/controller.ts");
const GetDancerById = () => import("./dancers/get-by-id/controller.ts");
const CreateFavorite = () => import("./favorites/create/controller.ts");
const DeleteFavorite = () => import("./favorites/delete/controller.ts");
const ListFavorites = () => import("./favorites/list/controller.ts");
const UpsertNote = () => import("./notes/upsert/controller.ts");
const DeleteNote = () => import("./notes/delete/controller.ts");
const UpsertRating = () => import("./ratings/upsert/controller.ts");
const ListRankings = () => import("./rankings/controller.ts");

const ListSchools = () => import("./schools/list/controller.ts");
const ListSelections = () => import("./selections/list/controller.ts");
const CreateSelection = () => import("./selections/create/controller.ts");
const DeleteSelection = () => import("./selections/delete/controller.ts");

const ListCallbacks = () => import("./callbacks/list/controller.ts");
const CreateCallback = () => import("./callbacks/create/controller.ts");
const DeleteCallback = () => import("./callbacks/delete/controller.ts");
const AdminCallbackBoard = () =>
  import("./callbacks/admin-board/controller.ts");

const ListShowcases = () => import("./showcases/list/controller.ts");
const PublishShowcase = () => import("./showcases/publish/controller.ts");
const StartNextShowcase = () => import("./showcases/next/controller.ts");
const PublishedCallbacks = () =>
  import("./showcases/published-callbacks/controller.ts");
const DancerCallbacks = () =>
  import("./callbacks/dancer-callbacks/controller.ts");

router
  .group(() => {
    router.get(":slug/dancers", [ListDancersController]).openapi({
      summary: "List dancers across organization events",
      description: "Coach-scoped dancer search by name, bib number, or event.",
    });
    router.get(":slug/dancers/:rosterId", [GetDancerById]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent("coachDancerRead"),
    middleware.orgMember(),
    middleware.orgCoach(),
  ])
  .openapi({ tags: ["Org Scouting"] });

router
  .group(() => {
    router.get(":slug/favorites", [ListFavorites]);
    router
      .post(":slug/favorites", [CreateFavorite])
      .use(middleware.orgEventDancer());
    router
      .delete(":slug/favorites/:dancerRosterId", [DeleteFavorite])
      .use(middleware.orgEventDancer());
    router
      .put(":slug/dancers/:dancerRosterId/notes", [UpsertNote])
      .use(middleware.orgEventDancer());
    router
      .delete(":slug/dancers/:dancerRosterId/notes", [DeleteNote])
      .use(middleware.orgEventDancer());
    router
      .put(":slug/dancers/:dancerRosterId/rating", [UpsertRating])
      .use(middleware.orgEventDancer());
    router.get(":slug/rankings", [ListRankings]);
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

router
  .group(() => {
    router.get(":slug/schools", [ListSchools]);
    router.get(":slug/my-selections", [ListSelections]);
    router.post(":slug/my-selections", [CreateSelection]);
    router.delete(":slug/my-selections/:id", [DeleteSelection]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgDancer(),
  ])
  .openapi({ tags: ["Org School Selections"] });

router
  .group(() => {
    router.get(":slug/callbacks", [ListCallbacks]);
    router
      .post(":slug/callbacks", [CreateCallback])
      .use(middleware.orgEventDancer());
    router
      .delete(":slug/callbacks/:dancerRosterId", [DeleteCallback])
      .use(middleware.orgEventDancer());
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgCoach(),
    middleware.orgFeature("callbacks"),
  ])
  .openapi({ tags: ["Org Callbacks"] });

router
  .group(() => {
    router.get(":slug/admin/callbacks", [AdminCallbackBoard]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgAdmin(),
    middleware.orgFeature("callbacks"),
  ])
  .openapi({ tags: ["Org Admin Callbacks"] });

router
  .group(() => {
    router.get(":slug/showcases", [ListShowcases]);
    router.get(":slug/showcases/:showcaseId/callbacks", [PublishedCallbacks]);
    router.post(":slug/showcases/publish", [PublishShowcase]);
    router.post(":slug/showcases/next", [StartNextShowcase]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgAdmin(),
    middleware.orgFeature("callbacks"),
  ])
  .openapi({ tags: ["Org Admin Showcases"] });

router
  .group(() => {
    router.get(":slug/dancer/callbacks", [DancerCallbacks]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgDancer(),
    middleware.orgFeature("callbacks"),
  ])
  .openapi({ tags: ["Org Dancer Callbacks"] });
