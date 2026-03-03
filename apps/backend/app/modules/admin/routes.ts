import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ApproveSchoolController = () => import("./approve-school/controller.ts");

router
  .group(() => {
    router.post("schools/:id/approve", [ApproveSchoolController]).openapi({
      summary: "Approve school application",
      description:
        "Approves a school application, setting verified=true and status=accepted",
    });
  })
  .use(middleware.auth())
  .prefix("admin")
  .openapi({ tags: ["Admin"] });
