import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const CreateEventController = () => import("./create/controller.ts");
const UpdateEventController = () => import("./update/controller.ts");
const DeleteEventController = () => import("./delete/controller.ts");
// Through the alias, not "./list/controller.ts": Tuyau finds a lazy
// controller's file by suffix, and that suffix also matches
// dancers/profile/get-profile-checklist/controller.ts.
const ListEventsController = () =>
  import("#modules/orgs/events/list/controller");
const UploadCoachesController = () => import("./upload-coaches/controller.ts");
const UploadDancersController = () => import("./upload-dancers/controller.ts");
const UploadPreviewController = () => import("./upload-preview/controller.ts");
const EventStatsController = () => import("./stats/controller.ts");
const ListRosterController = () => import("./rosters/list/controller.ts");
const UpdateRosterController = () => import("./rosters/update/controller.ts");
const SetRosterPaidController = () =>
  import("./rosters/set-paid/controller.ts");
const DeleteRosterController = () => import("./rosters/delete/controller.ts");
const ExportRosterController = () => import("./rosters/export/controller.ts");
const FiltersRosterController = () => import("./rosters/filters/controller.ts");
const StatsRosterController = () => import("./rosters/stats/controller.ts");
const ResendInvitesController = () =>
  import("./rosters/resend-invites/controller.ts");
const AttachAccountController = () => import("./rosters/attach/controller.ts");
const SearchDancerUsersController = () =>
  import("./rosters/attach/search-controller.ts");
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
const ListInvitesController = () =>
  import("./reconciliation/invites-controller.ts");
const ListOrphansController = () =>
  import("./reconciliation/orphans-controller.ts");
const ReconciliationCountsController = () =>
  import("./reconciliation/counts-controller.ts");
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
const AudioUploadUrlController = () =>
  import("./videos/audio-upload-url/controller.ts");
const ViewAsController = () => import("./view-as/controller.ts");
const CheckInController = () => import("./check-in/controller.ts");
const AdminCheckInController = () => import("./rosters/check-in/controller.ts");
const RosterCheckInCodeController = () =>
  import("./rosters/check-in-code/controller.ts");
const ResetCheckInController = () =>
  import("./rosters/check-in/reset/controller.ts");
const CheckInStatusController = () => import("./check-in/status-controller.ts");
const ScanCheckInController = () => import("./check-in/scan/controller.ts");
const ScheduleController = () => import("./schedule/controller.ts");
const ScheduleFileController = () => import("./schedule-file/controller.ts");
const ScheduleUrlController = () => import("./schedule-url/controller.ts");
const TestEmailsController = () => import("./test-emails/controller.ts");

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
      .delete(":slug/events/:id", [DeleteEventController])
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
      .patch(":slug/events/:id/rosters/:rosterId/paid", [
        SetRosterPaidController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
        middleware.orgFeature("freeTierUsers"),
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
      .post(":slug/events/:id/rosters/:rosterId/attach", [
        AttachAccountController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/rosters/search-dancers", [
        SearchDancerUsersController,
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
      .get(":slug/events/:id/reconciliation/invites", [ListInvitesController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/reconciliation/orphans", [ListOrphansController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/reconciliation/counts", [
        ReconciliationCountsController,
      ])
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
      .post(":slug/events/test-emails", [TestEmailsController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ])
      .openapi({
        summary: "Send a test org email to the current admin",
        description:
          "Renders one of the org event email templates with the logged-in admin's name/email and the selected event's details, then sends it to the admin for visual testing.",
      });
    router
      .post(":slug/events/view-as", [ViewAsController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/check-in/status", [CheckInStatusController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("dancerSelfRead"),
        middleware.orgMember(),
      ]);
    router
      .post(":slug/events/:id/check-in", [CheckInController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent(),
        middleware.orgMember(),
      ]);
    router
      .post(":slug/events/:id/rosters/check-in/reset", [ResetCheckInController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/:id/rosters/:rosterId/check-in", [
        AdminCheckInController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/rosters/:rosterId/check-in-code", [
        RosterCheckInCodeController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ])
      .openapi({
        summary: "Get a dancer's check-in pass code",
        description:
          "Returns the signed code a Dancer's check-in pass QR encodes, so an organizer can show the pass at the desk. 404 when the Roster Entry is not a Dancer in this event of this org.",
      });
    router
      .post(":slug/events/:id/check-in/scan", [ScanCheckInController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ])
      .openapi({
        summary: "Check a dancer in from their pass",
        description:
          "Verifies the signed code from a Dancer's check-in pass QR and sets their check-in time if it is not set yet. A repeat scan returns already_checked_in and changes nothing.",
      });
    router
      .get(":slug/events/:id/schedule", [ScheduleController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("dancerSelfRead"),
        middleware.orgMember(),
      ]);
    router
      .get(":slug/events/:id/schedule/file", [ScheduleFileController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("dancerSelfRead"),
        middleware.orgMember(),
      ])
      .openapi({
        summary: "Get an Org Event's schedule file",
        description:
          "Streams the schedule file through the API, for clients that cannot read it from storage directly. Send ?v=<schedule key> to let the browser cache it; revalidation with If-None-Match gets a 304. 404 when the Org Event has no schedule.",
      });
    router
      .get(":slug/events/:id/schedule/url", [ScheduleUrlController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("dancerSelfRead"),
        middleware.orgMember(),
      ])
      .openapi({
        summary: "Get a signed URL for an Org Event's schedule file",
        description:
          "Returns a storage URL, valid for an hour, that a browser can fetch without credentials so the file never passes through the API. 404 when the Org Event has no schedule.",
      });

    // Video categories
    router
      .get(":slug/events/:id/video-categories", [ListVideoCategoriesController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("scoped"),
        middleware.orgEvent("dancerSelfRead"),
        middleware.orgMember(),
      ]);
    router
      .post(":slug/events/:id/video-categories", [
        CreateVideoCategoryController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("scoped"),
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
        middleware.orgEvent("scoped"),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);

    // Videos
    router
      .get(":slug/events/:id/videos", [ListVideosController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("scoped"),
        middleware.orgEvent("dancerSelfRead"),
        middleware.orgMember(),
      ]);
    router
      .post(":slug/events/:id/videos", [CreateVideoController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("scoped"),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .patch(":slug/events/:id/videos/:videoId", [UpdateVideoController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("scoped"),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .delete(":slug/events/:id/videos/:videoId", [DeleteVideoController])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("scoped"),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .post(":slug/events/:id/videos/audio-upload-url", [
        AudioUploadUrlController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgEvent("scoped"),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
  })
  .prefix("orgs");
