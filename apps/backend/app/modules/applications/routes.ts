import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetApplicationController = () =>
  import("./get-application/controller.ts");
const SubmitApplicationController = () =>
  import("./submit-application/controller.ts");
const UpdateApplicationController = () =>
  import("./update-application/controller.ts");

router
  .group(() => {
    router.get("application", [GetApplicationController]).openapi({
      summary: "Get application status",
      description: "Returns the school's application details",
    });
    router.post("application", [SubmitApplicationController]).openapi({
      summary: "Submit application",
      description: "Submits the school's application",
    });
    router.patch("application", [UpdateApplicationController]).openapi({
      summary: "Update application",
      description: "Updates the school's application",
    });
  })
  .use(middleware.auth())
  .openapi({ tags: ["Applications"] });
