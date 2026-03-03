import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const ContactUsController = () => import("./contact-us/controller.ts");
const FeedbackController = () => import("./feedback/controller.ts");

router
  .group(() => {
    router
      .post("contact", [ContactUsController])
      .openapi({
        summary: "Contact us",
        description: "Sends a contact form message to the team",
      })
      .use(throttle("contact", 5));

    router
      .post("feedback", [FeedbackController])
      .openapi({
        summary: "Submit feedback",
        description: "Submits user feedback to the team",
      })
      .use([middleware.auth(), throttle("feedback", 10)]);
  })
  .openapi({ tags: ["Contact"] });
