import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetEventByIdController = () => import("./get-event-by-id/controller.ts");
const GetEventsController = () => import("./get-events/controller.ts");
const GetGlobalEventsController = () =>
  import("./get-global-events/controller.ts");

router
  .group(() => {
    router.get("/", [GetEventsController]).openapi({
      summary: "Get all events",
      description: "Returns a list of all upcoming events",
    });

    router.get("/global", [GetGlobalEventsController]).openapi({
      summary: "Get all global events",
      description: "Returns a list of all upcoming global events",
    });

    router.get("/:id", [GetEventByIdController]).openapi({
      summary: "Get event by id",
      description: "Returns details about a specific event",
    });
  })
  .use(middleware.auth())
  .prefix("events")
  .openapi({ tags: ["Events"] });
