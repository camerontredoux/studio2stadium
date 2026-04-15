import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const CreateEventController = () => import("./create/controller.ts");
const UpdateEventController = () => import("./update/controller.ts");
const ListEventsController = () => import("./list/controller.ts");
const UploadCoachesController = () => import("./upload-coaches/controller.ts");
const UploadDancersController = () => import("./upload-dancers/controller.ts");
const UploadPreviewController = () => import("./upload-preview/controller.ts");
const EventStatsController = () => import("./stats/controller.ts");
const ListRosterController = () => import("./rosters/list/controller.ts");
const UpdateRosterController = () => import("./rosters/update/controller.ts");
const DeleteRosterController = () => import("./rosters/delete/controller.ts");
const ExportRosterController = () => import("./rosters/export/controller.ts");
const FiltersRosterController = () => import("./rosters/filters/controller.ts");
const StatsRosterController = () => import("./rosters/stats/controller.ts");
const ResendInvitesController = () => import("./rosters/resend-invites/controller.ts");
const ListChecklistController = () => import("./checklist/list/controller.ts");
const CreateChecklistController = () => import("./checklist/create/controller.ts");
const UpdateChecklistController = () => import("./checklist/update/controller.ts");
const DeleteChecklistController = () => import("./checklist/delete/controller.ts");

router.group(() => {
  router.post(":slug/events", [CreateEventController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.patch(":slug/events/:id", [UpdateEventController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events", [ListEventsController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.post(":slug/events/:id/upload/coaches", [UploadCoachesController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.post(":slug/events/:id/upload/dancers", [UploadDancersController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.post(":slug/events/:id/upload/:type/preview", [UploadPreviewController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events/:id/stats", [EventStatsController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events/:id/rosters/export", [ExportRosterController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events/:id/rosters/filters", [FiltersRosterController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events/:id/rosters/stats", [StatsRosterController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events/:id/rosters", [ListRosterController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.patch(":slug/events/:id/rosters/:rosterId", [UpdateRosterController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.delete(":slug/events/:id/rosters", [DeleteRosterController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.post(":slug/events/:id/rosters/resend-invites", [ResendInvitesController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events/:id/checklist", [ListChecklistController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.post(":slug/events/:id/checklist", [CreateChecklistController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.patch(":slug/events/:id/checklist/:itemId", [UpdateChecklistController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.delete(":slug/events/:id/checklist/:itemId", [DeleteChecklistController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
}).prefix("orgs");
