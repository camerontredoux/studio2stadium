const GetUsernameAvailableController = () => import("./onboard/index.ts");
import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

router
  .group(() => {
    router
      .post("/onboard", [GetUsernameAvailableController])
      .openapi({
        summary: "Onboard a dancer",
        description: "Populate personal information to finish dancer signup",
      })
      .use(middleware.auth());
  })
  .prefix("dancer")
  .openapi({ tags: ["Dancer"] });
