import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const CreateDancerController = () => import("./create-dancer/index.ts");

router
  .group(() => {
    router
      .post("/", [CreateDancerController])
      .openapi({
        summary: "Create a dancer",
        description:
          "Populate account with personal information to finish dancer signup",
      })
      .use(middleware.auth());
  })
  .prefix("dancers")
  .openapi({ tags: ["Dancers"] });
