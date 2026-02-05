import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ListEventsController = () => import("./list-events/controller.ts");

router
  .group(() => {
    router.get("/", [ListEventsController]).openapi({
      summary: "List events",
      description: "Returns a list of events",
    });
  })
  .use(middleware.auth())
  .prefix("events")
  .openapi({ tags: ["Events"] });
