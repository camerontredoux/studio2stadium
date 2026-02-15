import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const GetEventByIdController = () => import("./get-event-by-id/controller.ts");
const GetEventsController = () => import("./get-events/controller.ts");
const GetGlobalEventsController = () =>
  import("./get-global-events/controller.ts");
const SaveEventController = () => import("./save-event/controller.ts");
const UnsaveEventController = () => import("./unsave-event/controller.ts");

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

    router
      .post("/:id/save", [SaveEventController])
      .openapi({
        summary: "Save event",
        description: "Saves an event for the current user",
      })
      .use(throttle("save-event"));

    router
      .delete("/:id/unsave", [UnsaveEventController])
      .openapi({
        summary: "Unsave event",
        description: "Unsaves an event for the current user",
      })
      .use(throttle("unsave-event"));
  })
  .use(middleware.auth())
  .prefix("events")
  .openapi({ tags: ["Events"] });
