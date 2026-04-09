import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const CreateEventController = () => import("./create/controller.ts");
const UpdateEventController = () => import("./update/controller.ts");
const ListEventsController = () => import("./list/controller.ts");
const UploadCoachesController = () => import("./upload-coaches/controller.ts");
const UploadDancersController = () => import("./upload-dancers/controller.ts");
const UploadPreviewController = () => import("./upload-preview/controller.ts");
const EventStatsController = () => import("./stats/controller.ts");

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
}).prefix("orgs");
