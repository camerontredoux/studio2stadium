import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

router
  .group(() => {
    router
      .post("/", () => {})
      .openapi({
        summary: "Create user account",
        description: "Creates a new base user account.",
      });
  })
  .use(middleware.auth())
  .prefix("events")
  .openapi({ tags: ["Global Events"] });
