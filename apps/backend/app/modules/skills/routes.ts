import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetSkillsController = () =>
  import("#modules/skills/get-skills/controller");

router
  .group(() => {
    router.get("", [GetSkillsController]).openapi({
      summary: "Get all skills",
      description: "Returns a list of all skills",
    });
  })
  .use(middleware.auth())
  .prefix("skills")
  .openapi({ tags: ["Skills"] });
