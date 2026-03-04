import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";
const DeleteEventController = () => import("./delete-event/controller.ts");
const EditEventController = () => import("./edit-event/controller.ts");
const CreateEventController = () => import("./create-event/controller.ts");
const GetEventByIdController = () => import("./get-event-by-id/controller.ts");
const GetEventsController = () => import("./get-events/controller.ts");
const GetGlobalEventsController = () =>
  import("./get-global-events/controller.ts");
const GetUpcomingGlobalEventsController = () =>
  import("./get-upcoming-global-events/controller.ts");
const SaveEventController = () => import("./save-event/controller.ts");
const UnsaveEventController = () => import("./unsave-event/controller.ts");
const GetUpcomingEventsController = () =>
  import("./get-upcoming-events/controller.ts");
const GetEventFiltersController = () =>
  import("./get-event-filters/controller.ts");

router
  .group(() => {
    router.get("filters", [GetEventFiltersController]).openapi({
      summary: "Get event filters",
      description: "Returns the filters to use when searching for events",
    });

    router.get("", [GetEventsController]).openapi({
      summary: "Get all events",
      description: "Returns a list of all upcoming events",
    });

    router
      .post("", [CreateEventController])
      .openapi({
        summary: "Create event",
        description: "Creates a new school hosted event",
      })
      .use(middleware.school());

    router.get("upcoming", [GetUpcomingEventsController]).openapi({
      summary: "Get upcoming events",
      description: "Returns a list of upcoming events",
    });

    router.get("global", [GetGlobalEventsController]).openapi({
      summary: "Get all global events",
      description: "Returns a list of all upcoming global events",
    });

    router.get("global/upcoming", [GetUpcomingGlobalEventsController]).openapi({
      summary: "Get upcoming global events",
      description: "Returns a list of upcoming global events",
    });

    router.patch(":id", [EditEventController]).openapi({
      summary: "Edit event",
      description: "Edits a school hosted event",
    });

    router.get(":id", [GetEventByIdController]).openapi({
      summary: "Get event by id",
      description: "Returns details about a specific event",
    });

    router.delete(":id", [DeleteEventController]).openapi({
      summary: "Delete event",
      description: "Deletes a school hosted event",
    });

    router
      .post(":id/save", [SaveEventController])
      .openapi({
        summary: "Save event",
        description: "Saves an event for the current user",
      })
      .use(throttle("save-event", 30));

    router
      .delete(":id/unsave", [UnsaveEventController])
      .openapi({
        summary: "Unsave event",
        description: "Unsaves an event for the current user",
      })
      .use(throttle("unsave-event", 30));
  })
  .use(middleware.auth())
  .prefix("events")
  .openapi({ tags: ["Events"] });
