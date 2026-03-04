import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetNotificationsController = () =>
  import("./get-notifications/controller.ts");
const GetNotificationCountController = () =>
  import("./get-count/controller.ts");
const MarkReadController = () => import("./mark-read/controller.ts");
const MarkAllReadController = () => import("./mark-all-read/controller.ts");
const StreamController = () => import("./stream/controller.ts");

router
  .group(() => {
    router.get("/", [GetNotificationsController]).openapi({
      summary: "Get notifications",
      description: "Returns the user's notifications with enriched data",
    });

    router.get("/count", [GetNotificationCountController]).openapi({
      summary: "Get notification count",
      description: "Returns the count of unread notifications",
    });

    router.get("/stream", [StreamController]).openapi({
      summary: "Realtime notification stream",
      description: "SSE endpoint for realtime notifications",
    });

    router.post("/read-all", [MarkAllReadController]).openapi({
      summary: "Mark all notifications as read",
      description: "Marks all notifications as read by setting seenAt",
    });

    router.post("/:id", [MarkReadController]).openapi({
      summary: "Mark notification as read",
      description: "Marks a notification as read by setting seenAt",
    });
  })
  .prefix("notifications")
  .use(middleware.auth())
  .openapi({ tags: ["Notifications"] });
