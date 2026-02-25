import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetStylesController = () =>
  import("#modules/styles/get-styles/controller");

router
  .group(() => {
    router.get("", [GetStylesController]).openapi({
      summary: "Get all styles",
      description: "Returns a list of all styles",
    });
  })
  .use(middleware.auth())
  .prefix("styles")
  .openapi({ tags: ["Styles"] });
