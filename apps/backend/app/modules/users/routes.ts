import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const CheckAvailabilityController = () =>
  import("./check-availability/index.ts");

router
  .group(() => {
    router
      .get("/check-availability", [CheckAvailabilityController])
      .openapi({
        summary: "Check username availability",
        description: "Checks if a username is available for registration.",
      })
      .use([throttle("username-available", "memory")]);
  })
  .prefix("users")
  .openapi({ tags: ["Users"] });
