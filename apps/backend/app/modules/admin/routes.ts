import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ApproveSchoolController = () => import("./approve-school/controller.ts");
const AddSchoolEventController = () =>
  import("./add-school-event/controller.ts");
const AddGlobalEventController = () =>
  import("./add-global-event/controller.ts");
const GetApplicationsController = () =>
  import("./get-applications/controller.ts");
const GetSchoolsController = () => import("./get-schools/controller.ts");
const GetDancersController = () => import("./get-dancers/controller.ts");

router
  .group(() => {
    router.post("schools/:id/approve", [ApproveSchoolController]).openapi({
      summary: "Approve school application",
      description:
        "Approves a school application, setting verified=true and status=accepted",
    });

    router
      .post("schools/:schoolId/events", [AddSchoolEventController])
      .openapi({
        summary: "Add event to school",
        description: "Creates an event for a school by profileId",
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
  })
  .use([middleware.auth(), middleware.admin()])
  .prefix("admin")
  .openapi({ tags: ["Admin"] });
