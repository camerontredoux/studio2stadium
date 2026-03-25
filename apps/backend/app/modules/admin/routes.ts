import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const UpdateApplicationStatusController = () =>
  import("#modules/admin/update-application-status/controller");
const AddSchoolEventController = () =>
  import("#modules/admin/add-school-event/controller");
const AddGlobalEventController = () =>
  import("#modules/admin/add-global-event/controller");
const EditSchoolEventController = () =>
  import("#modules/admin/edit-school-event/controller");
const EditGlobalEventController = () =>
  import("#modules/admin/edit-global-event/controller");
const GetApplicationsController = () =>
  import("#modules/admin/get-applications/controller");
const GetSchoolsController = () =>
  import("#modules/admin/get-all-schools/controller");
const GetDancersController = () =>
  import("#modules/admin/get-all-dancers/controller");
const CreateBlogPostController = () =>
  import("#modules/admin/create-blog-post/controller");
const DeleteBlogPostController = () =>
  import("#modules/admin/delete-blog-post/controller");
const GetOutboxStatsController = () =>
  import("#modules/admin/get-outbox-stats/controller");
const GetOutboxStatsHistoryController = () =>
  import("#modules/admin/get-outbox-stats-history/controller");
const GetDancerStatsController = () =>
  import("#modules/admin/get-dancer-stats/controller");
const AddTrainingVideoController = () =>
  import("#modules/admin/add-training-video/controller");
const DeleteTrainingVideoController = () =>
  import("#modules/admin/delete-training-video/controller");
const UpdateSchoolProgramController = () =>
  import("#modules/admin/update-school-program/controller");
const UpdateSchoolSkillsController = () =>
  import("#modules/admin/update-school-skills/controller");
const UpdateSchoolStylesController = () =>
  import("#modules/admin/update-school-styles/controller");
const UpdateSchoolSportsController = () =>
  import("#modules/admin/update-school-sports/controller");
const UpdateSchoolAccountController = () =>
  import("#modules/admin/update-school-account/controller");
const UpdateSchoolAvatarController = () =>
  import("#modules/admin/update-school-avatar/controller");

router
  .group(() => {
    router
      .patch("applications/:id/status", [UpdateApplicationStatusController])
      .openapi({
        summary: "Update application status",
        description:
          "Updates a school application status to accepted or rejected",
      });

    router
      .post("schools/:username/events", [AddSchoolEventController])
      .openapi({
        summary: "Add event to school",
        description: "Creates an event for a school by username",
      });

    router
      .patch("schools/:username/profile", [UpdateSchoolProgramController])
      .openapi({
        summary: "Update school program profile",
        description:
          "Updates a school's program profile (same fields as PATCH /schools/me for the school)",
      });

    router
      .patch("schools/:username/skills", [UpdateSchoolSkillsController])
      .openapi({
        summary: "Update school skills",
        description:
          "Replaces the school's skills (same as PATCH /schools/me/skills)",
      });

    router
      .patch("schools/:username/styles", [UpdateSchoolStylesController])
      .openapi({
        summary: "Update school styles",
        description:
          "Replaces the school's styles (same as PATCH /schools/me/styles)",
      });

    router
      .patch("schools/:username/sports", [UpdateSchoolSportsController])
      .openapi({
        summary: "Update school sports",
        description:
          "Replaces the school's sports (same as PATCH /schools/me/sports)",
      });

    router
      .patch("schools/:username/account", [UpdateSchoolAccountController])
      .openapi({
        summary: "Update school account",
        description:
          "Updates the school user's account fields (email, name, phone, etc.; same as PATCH /users/account)",
      });

    router
      .post("schools/:username/avatar", [UpdateSchoolAvatarController])
      .openapi({
        summary: "Set school avatar",
        description:
          "Sets the school user's avatar from an uploaded R2 key (same as POST /users/avatar)",
      });

    router.post("events/global", [AddGlobalEventController]).openapi({
      summary: "Add global event",
      description: "Creates a global dance event",
    });

    router.patch("events/school/:id", [EditSchoolEventController]).openapi({
      summary: "Edit school event",
      description: "Updates a school event by ID",
    });

    router.patch("events/global/:id", [EditGlobalEventController]).openapi({
      summary: "Edit global event",
      description: "Updates a global event by ID",
    });

    router.get("applications", [GetApplicationsController]).openapi({
      summary: "Get all applications",
      description: "Returns all school applications for admin review",
    });

    router.get("schools", [GetSchoolsController]).openapi({
      summary: "Get all schools",
      description: "Returns all schools for admin dashboard",
    });

    router.get("dancers", [GetDancersController]).openapi({
      summary: "Get all dancers",
      description: "Returns all dancers for admin dashboard",
    });

    router.post("blog", [CreateBlogPostController]).openapi({
      summary: "Create blog post",
      description:
        "Creates a new blog post with title, content, and optional cover image",
    });

    router.delete("blog/:id", [DeleteBlogPostController]).openapi({
      summary: "Delete blog post",
      description: "Permanently deletes a blog post by ID",
    });

    router.get("outbox/stats", [GetOutboxStatsController]).openapi({
      summary: "Get outbox stats",
      description: "Returns aggregated counts of outbox items by type",
    });

    router
      .get("outbox/stats/history", [GetOutboxStatsHistoryController])
      .openapi({
        summary: "Get outbox stats history",
        description:
          "Returns historical outbox stats with daily, weekly, and monthly breakdowns",
      });

    router.get("dancers/stats", [GetDancerStatsController]).openapi({
      summary: "Get dancer signup stats",
      description:
        "Returns dancer signup statistics with DAU/WAU/MAU and percentage changes",
    });

    router.post("library/videos", [AddTrainingVideoController]).openapi({
      summary: "Add training video",
      description: "Adds a training video to the video library",
    });

    router
      .delete("library/videos/:id", [DeleteTrainingVideoController])
      .openapi({
        summary: "Delete training video",
        description: "Permanently deletes a training video by ID",
      });
  })
  .use([middleware.auth(), middleware.admin()])
  .prefix("admin")
  .openapi({ tags: ["Admin"] });
