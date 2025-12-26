import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";
const InvalidateSessionController = () => import("./invalidate-session/controller.ts");
const GetSessionController = () => import("./get-session/controller.ts");
const LogoutController = () => import("./logout/controller.ts");
const LoginController = () => import("./login/controller.ts");
const SignupController = () => import("./signup/controller.ts");

router
  .group(() => {
    router.post("/signup", [SignupController]).openapi({
      summary: "Create user account",
      description: "Creates a new base user account.",
    });
    router.post("/login", [LoginController]).openapi({
      summary: "Start user session",
      description: "Logs in a user and creates a session in Redis.",
    });
    router
      .post("/logout", [LogoutController])
      .openapi({
        summary: "End user session",
        description: "Logs out the current user and deletes their session from Redis.",
      })
      .use(middleware.auth());
    router
      .post("/invalidate-session", [InvalidateSessionController])
      .openapi({
        summary: "Invalidate user session",
        description: "Invalidates the current user's session and deletes their session from Redis.",
      })
      .use(middleware.auth());
    router
      .get("/session", [GetSessionController])
      .openapi({
        summary: "Get user session",
        description: "Retrieves the current session's user information.",
      })
      .use(middleware.auth());
  })
  .prefix("account")
  .openapi({ tags: ["Authentication"] });
