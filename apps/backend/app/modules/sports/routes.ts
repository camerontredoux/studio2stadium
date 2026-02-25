import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetSportsController = () =>
  import("#modules/sports/get-sports/controller");

router
  .group(() => {
    router.get("", [GetSportsController]).openapi({
      summary: "Get all sports",
      description: "Returns a list of all sports",
    });
  })
  .use(middleware.auth())
  .prefix("sports")
  .openapi({ tags: ["Sports"] });
