const HealthChecksController = () => import("#modules/health/controller");
import env from "#start/env";
import router from "@adonisjs/core/services/router";

router
  .get("/health", [HealthChecksController])
  .use(({ request, response }, next) => {
    if (request.header("X-Health-Secret") === env.get("HEALTH_SECRET")) {
      return next();
    }
    response.unauthorized({ message: "Unauthorized access" });
  });
