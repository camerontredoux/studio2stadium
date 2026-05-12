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
const ResendInvitesController = () =>
  import("./rosters/resend-invites/controller.ts");
const ListChecklistController = () => import("./checklist/list/controller.ts");
const CreateChecklistController = () =>
  import("./checklist/create/controller.ts");
const UpdateChecklistController = () =>
  import("./checklist/update/controller.ts");
const DeleteChecklistController = () =>
  import("./checklist/delete/controller.ts");
const ListAuditLogController = () => import("./audit-log/list/controller.ts");
const AuditLogStatsController = () => import("./audit-log/stats/controller.ts");
const ListAuditLogChildrenController = () =>
  import("./audit-log/children/controller.ts");
const ListReconciliationController = () =>
  import("./reconciliation/list-controller.ts");
const ResendInviteController = () =>
  import("./reconciliation/resend-controller.ts");
const RevokeInviteController = () =>
  import("./reconciliation/revoke-controller.ts");
const ManualMergeController = () =>
  import("./reconciliation/merge-controller.ts");
const SearchSchoolUsersController = () =>
  import("./reconciliation/search-users-controller.ts");
const ListVideoCategoriesController = () =>
  import("./video-categories/list/controller.ts");
const CreateVideoCategoryController = () =>
  import("./video-categories/create/controller.ts");
const DeleteVideoCategoryController = () =>
  import("./video-categories/delete/controller.ts");
const ListVideosController = () => import("./videos/list/controller.ts");
const CreateVideoController = () => import("./videos/create/controller.ts");
const UpdateVideoController = () => import("./videos/update/controller.ts");
const DeleteVideoController = () => import("./videos/delete/controller.ts");
const AttendEventController = () => import("./attend/controller.ts");
const ScheduleController = () => import("./schedule/controller.ts");

router
  .group(() => {
    router
      .post(":slug/events", [CreateEventController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .patch(":slug/events/:id", [UpdateEventController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events", [ListEventsController])
      .use([middleware.auth(), middleware.org(), middleware.orgMember()]);
    router
      .post(":slug/events/:id/upload/coaches", [UploadCoachesController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/:id/upload/dancers", [UploadDancersController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/:id/upload/:type/preview", [UploadPreviewController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/stats", [EventStatsController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/rosters/export", [ExportRosterController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/rosters/filters", [FiltersRosterController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/rosters/stats", [StatsRosterController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/rosters", [ListRosterController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .patch(":slug/events/:id/rosters/:rosterId", [UpdateRosterController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .delete(":slug/events/:id/rosters", [DeleteRosterController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/:id/rosters/resend-invites", [
        ResendInvitesController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/checklist", [ListChecklistController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/:id/checklist", [CreateChecklistController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .patch(":slug/events/:id/checklist/:itemId", [UpdateChecklistController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .delete(":slug/events/:id/checklist/:itemId", [DeleteChecklistController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/audit-log/stats", [AuditLogStatsController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/audit-log/:entryId/children", [
        ListAuditLogChildrenController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/audit-log", [ListAuditLogController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/reconciliation", [ListReconciliationController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/:id/reconciliation/invites/:inviteId/resend", [
        ResendInviteController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .delete(":slug/events/:id/reconciliation/invites/:inviteId", [
        RevokeInviteController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/:id/reconciliation/rosters/:rosterId/merge", [
        ManualMergeController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/reconciliation/school-users", [
        SearchSchoolUsersController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/attend", [AttendEventController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/schedule", [ScheduleController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
      ]);

    // Video categories
    router
      .get(":slug/events/:id/video-categories", [
        ListVideoCategoriesController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
      ]);
    router
      .post(":slug/events/:id/video-categories", [
        CreateVideoCategoryController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .delete(":slug/events/:id/video-categories/:categoryId", [
        DeleteVideoCategoryController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);

    // Videos
    router
      .get(":slug/events/:id/videos", [ListVideosController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
      ]);
    router
      .post(":slug/events/:id/videos", [CreateVideoController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .patch(":slug/events/:id/videos/:videoId", [UpdateVideoController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .delete(":slug/events/:id/videos/:videoId", [DeleteVideoController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
  })
  .prefix("orgs");
