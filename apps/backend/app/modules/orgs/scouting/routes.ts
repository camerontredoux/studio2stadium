import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ListDancersController = () => import("./dancers/list/controller.ts");
const GetDancerById = () => import("./dancers/get-by-id/controller.ts");
const SummarizeDancers = () => import("./dancers/summary/controller.ts");
const CreateFavorite = () => import("./favorites/create/controller.ts");
const DeleteFavorite = () => import("./favorites/delete/controller.ts");
const ListFavorites = () => import("./favorites/list/controller.ts");
const UpsertNote = () => import("./notes/upsert/controller.ts");
const DeleteNote = () => import("./notes/delete/controller.ts");
const UpsertRating = () => import("./ratings/upsert/controller.ts");
const DeleteRating = () => import("./ratings/delete/controller.ts");
const ListRankings = () => import("./rankings/controller.ts");

const ListSchools = () => import("./schools/list/controller.ts");
const SchoolPage = () => import("./schools/page/controller.ts");
const ListSelections = () => import("./selections/list/controller.ts");
const CreateSelection = () => import("./selections/create/controller.ts");
const DeleteSelection = () => import("./selections/delete/controller.ts");
const MoveSelection = () => import("./selections/move/controller.ts");

const ListCallbacks = () => import("./callbacks/list/controller.ts");
const CallbackHistory = () => import("./callbacks/history/controller.ts");
const CreateCallback = () => import("./callbacks/create/controller.ts");
const DeleteCallback = () => import("./callbacks/delete/controller.ts");
const AdminCallbackBoard = () =>
  import("./callbacks/admin-board/controller.ts");
const DancerCallbackDetail = () =>
  import("./callbacks/dancer-detail/controller.ts");
const CoachDancerCallbackDetail = () =>
  import("./callbacks/coach-dancer-detail/controller.ts");

const ListShowcases = () => import("./showcases/list/controller.ts");
const PublishShowcase = () => import("./showcases/publish/controller.ts");
const PublishPreview = () =>
  import("./showcases/publish-preview/controller.ts");
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
    router.get(":slug/dancer-summary", [SummarizeDancers]).openapi({
      summary: "Summarize the coach's dancers",
      description:
        "Review progress, talent pool and recent activity for the coach's Dancers sidebar. Takes the dancer list's filters.",
    });
    router.get(":slug/dancers/:rosterId", [GetDancerById]);
    // Reading a past event's favorites has to survive the coach not being on
    // the active event's roster, so it belongs with the other browse routes
    // rather than with the writes below.
    router.get(":slug/favorites", [ListFavorites]);
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
    router
      .delete(":slug/dancers/:dancerRosterId/rating", [DeleteRating])
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
    router.get(":slug/schools/page", [SchoolPage]).openapi({
      summary: "List a page of schools",
      description:
        "A page of the org's schools, one per school, by name. `search` matches the school or coach name.",
    });
    router.get(":slug/my-selections", [ListSelections]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent("dancerSelfRead"),
    middleware.orgMember(),
    middleware.orgDancer(),
    middleware.orgFeature("school_selections"),
  ])
  .openapi({ tags: ["Org School Selections"] });

router
  .group(() => {
    router.post(":slug/my-selections", [CreateSelection]).openapi({
      summary: "Add a top choice",
      description:
        "Adds a school to the dancer's selections for the active Org Event, ranked after the existing ones. Adding a school already selected returns it unchanged; 422 when the org's limit is reached.",
    });
    router.delete(":slug/my-selections/:id", [DeleteSelection]).openapi({
      summary: "Remove a top choice",
      description:
        "Removes one of the dancer's school selections for the active Org Event. The schools ranked below it move up one place.",
    });
    router.post(":slug/my-selections/:id/move", [MoveSelection]).openapi({
      summary: "Move a top choice up or down",
      description:
        "Swaps one of the dancer's school selections with the one ranked above (up) or below (down) it, for the active Org Event, and returns the selections in their new order. 422 when the selection is already first or last.",
    });
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgDancer(),
    middleware.orgFeature("school_selections"),
  ])
  .openapi({ tags: ["Org School Selections"] });

router
  .group(() => {
    router.get(":slug/callbacks", [ListCallbacks]);
    router.get(":slug/callbacks/history", [CallbackHistory]).openapi({
      summary: "List the coach's callbacks by showcase",
      description:
        "The coach's own callbacks on the active event, newest showcase first: the current showcase's marks, then what each published showcase sent for the coach.",
    });
    // A coach's own-program view of a dancer's callbacks (scoped server-side).
    router.get(":slug/dancers/:dancerRosterId/callbacks", [
      CoachDancerCallbackDetail,
    ]);
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
    router.get(":slug/admin/dancers/:dancerRosterId/callbacks", [
      DancerCallbackDetail,
    ]);
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
    router.get(":slug/showcases/publish-preview", [PublishPreview]);
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
    middleware.orgEvent("dancerSelfRead"),
    middleware.orgMember(),
    middleware.orgDancer(),
    middleware.orgFeature("callbacks"),
  ])
  .openapi({ tags: ["Org Dancer Callbacks"] });
