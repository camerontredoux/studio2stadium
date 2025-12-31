import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";
const RefreshSessionController = () =>
  import("./refresh-session/controller.ts");
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
        description:
          "Logs out the current user and deletes their session from Redis.",
      })
      .use(middleware.auth());
    router
      .post("/refresh-session", [RefreshSessionController])
      .openapi({
        summary: "Refresh user session",
        description:
          "Refreshes the current user's session by bumping the Redis version.",
      })
      .use(middleware.auth());
    router
      .get("/session", [GetSessionController])
      .openapi({
        summary: "Get user session",
        description: "Retrieves the current session's user information.",
      })
      .use(middleware.auth());
    router
      .post("/test", async () => ({ message: "Hello, world!" }))
      .use(middleware.auth());
  })
  .prefix("auth")
  .openapi({ tags: ["Authentication"] });
