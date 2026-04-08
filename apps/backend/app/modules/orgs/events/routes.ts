import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const CreateEventController = () => import("./create/controller.ts");
const UpdateEventController = () => import("./update/controller.ts");
const ListEventsController = () => import("./list/controller.ts");

router.group(() => {
  router.post(":slug/events", [CreateEventController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.patch(":slug/events/:id", [UpdateEventController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events", [ListEventsController])
    .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
}).prefix("orgs");
