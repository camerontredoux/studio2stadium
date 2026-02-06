import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetEventByIdController = () => import("./get-event-by-id/controller.ts");
const ListEventsController = () => import("./list-events/controller.ts");

router
  .group(() => {
    router.get("/", [ListEventsController]).openapi({
      summary: "List events",
      description: "Returns a list of events",
    });

    router.get("/:id", [GetEventByIdController]).openapi({
      summary: "Get event by id",
      description: "Returns details about a specific event",
    });
  })
  .use(middleware.auth())
  .prefix("events")
  .openapi({ tags: ["Events"] });
