import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const UpdateApplicationStatusController = () =>
  import("#modules/admin/update-application-status/controller");
const AddSchoolEventController = () =>
  import("#modules/admin/add-school-event/controller");
const AddGlobalEventController = () =>
  import("#modules/admin/add-global-event/controller");
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

    router.post("events/global", [AddGlobalEventController]).openapi({
      summary: "Add global event",
      description: "Creates a global dance event",
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
  })
  .use([middleware.auth(), middleware.admin()])
  .prefix("admin")
  .openapi({ tags: ["Admin"] });
