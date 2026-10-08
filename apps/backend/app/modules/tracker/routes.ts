import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ListItemsController = () => import("./list-items/controller.ts");
const CreateItemController = () => import("./create-item/controller.ts");
const UpdateItemController = () => import("./update-item/controller.ts");
const DeleteItemController = () => import("./delete-item/controller.ts");
const DeleteSectionController = () => import("./delete-section/controller.ts");
const UpdateSectionOrderController = () =>
  import("./update-section-order/controller.ts");

router
  .group(() => {
    router.get("", [ListItemsController]).openapi({
      summary: "Get my recruiting tracker",
      description:
        "Returns the dancer's tracker items (newest first) and the order of their sections. In sectionOrder, null is the 'Everything else' section.",
    });
    router.post("items", [CreateItemController]).openapi({
      summary: "Add a tracker item",
      description:
        "Adds a school, clinic, audition, application milestone, or deadline. A school item's title is its school name.",
    });
    router.patch("items/:id", [UpdateItemController]).openapi({
      summary: "Update a tracker item",
      description:
        "Updates the title, school, date, notes, or stage of one of the dancer's tracker items.",
    });
    router.delete("items/:id", [DeleteItemController]).openapi({
      summary: "Delete a tracker item",
      description: "Deletes one of the dancer's tracker items.",
    });
    router.delete("sections", [DeleteSectionController]).openapi({
      summary: "Remove a school from the tracker",
      description:
        "Deletes the school item and every item the dancer tracks under that school.",
    });
    router.put("sections/order", [UpdateSectionOrderController]).openapi({
      summary: "Reorder tracker sections",
      description:
        "Saves the order of the dancer's tracker sections. Each entry is a school name, or null for 'Everything else'.",
    });
  })
  .use([middleware.auth(), middleware.dancer(), middleware.subscribed()])
  .prefix("tracker")
  .openapi({ tags: ["Tracker"] });
