import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const ListItemsController = () => import("./list-items/controller.ts");
const ListEventsController = () => import("./list-events/controller.ts");
const CreateItemController = () => import("./create-item/controller.ts");
const UpdateItemController = () => import("./update-item/controller.ts");
const DeleteItemController = () => import("./delete-item/controller.ts");
const DeleteSectionController = () => import("./delete-section/controller.ts");
const UpdateSectionOrderController = () =>
  import("./update-section-order/controller.ts");
const CreateMilestoneController = () =>
  import("./create-milestone/controller.ts");
const UpdateMilestoneController = () =>
  import("./update-milestone/controller.ts");
const DeleteMilestoneController = () =>
  import("./delete-milestone/controller.ts");

const MILESTONE_LIMIT_KEY = "tracker-milestones";
const MILESTONE_LIMIT = 60;

router
  .group(() => {
    router.get("", [ListItemsController]).openapi({
      summary: "Get my recruiting tracker",
      description:
        "Returns the dancer's tracker items (newest first), each with its school and event summaries or null, their school milestones (oldest first, with completedAt null until reached), and the order of their sections. sectionOrder lists school ids; null is the 'Everything else' section.",
    });
    router.get("events", [ListEventsController]).openapi({
      summary: "List events a clinic item can link",
      description:
        "Returns upcoming school-hosted events from verified schools, soonest first, each with its school. Pass schoolId to list only that school's events.",
    });
    router.post("items", [CreateItemController]).openapi({
      summary: "Add a tracker item",
      description:
        "Adds a school, clinic, audition, application milestone, or deadline. schoolId references the schools directory and is required for a school item, whose title is the school's name. An unknown schoolId is a 422. A clinic item may link an event with eventId; an event of another item type, an unknown or unlisted event, or one the schoolId doesn't host is a 422. A dancer commits to one school at most: a second Committed school is a 409 E_ALREADY_COMMITTED.",
    });
    router.patch("items/:id", [UpdateItemController]).openapi({
      summary: "Update a tracker item",
      description:
        "Updates the title, schoolId, eventId, date, notes, or stage of one of the dancer's tracker items. The eventId follows the same rules as on create. A school item's title always comes from its school. Committing to a second school is a 409 E_ALREADY_COMMITTED.",
    });
    router.delete("items/:id", [DeleteItemController]).openapi({
      summary: "Delete a tracker item",
      description: "Deletes one of the dancer's tracker items.",
    });
    router.delete("sections", [DeleteSectionController]).openapi({
      summary: "Remove a school from the tracker",
      description:
        "Deletes the school item, the school's milestones, and every item the dancer tracks under that school.",
    });
    // The milestone routes share one limit, so spam-clicking a chip can't flood
    // the API.
    router
      .post("milestones", [CreateMilestoneController])
      .openapi({
        summary: "Add a school milestone",
        description:
          "Adds a milestone the dancer wants to reach with a school, not yet completed. An unknown schoolId is a 422. Shares a limit of 60 requests a minute with the other milestone routes.",
      })
      .use(throttle(MILESTONE_LIMIT_KEY, MILESTONE_LIMIT));
    router
      .patch("milestones/:id", [UpdateMilestoneController])
      .openapi({
        summary: "Update a school milestone",
        description:
          "Renames one of the dancer's milestones or marks it complete. completed=true records when it was reached and keeps the original time if it was already complete; completed=false clears it. Shares a limit of 60 requests a minute with the other milestone routes.",
      })
      .use(throttle(MILESTONE_LIMIT_KEY, MILESTONE_LIMIT));
    router
      .delete("milestones/:id", [DeleteMilestoneController])
      .openapi({
        summary: "Delete a school milestone",
        description:
          "Deletes one of the dancer's milestones. Shares a limit of 60 requests a minute with the other milestone routes.",
      })
      .use(throttle(MILESTONE_LIMIT_KEY, MILESTONE_LIMIT));
    router.put("sections/order", [UpdateSectionOrderController]).openapi({
      summary: "Reorder tracker sections",
      description:
        "Saves the order of the dancer's tracker sections. Each entry is a school id, or null for 'Everything else'.",
    });
  })
  .use([middleware.auth(), middleware.dancer(), middleware.subscribed()])
  .prefix("tracker")
  .openapi({ tags: ["Tracker"] });
