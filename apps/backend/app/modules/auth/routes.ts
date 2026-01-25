import { middleware } from "#start/kernel";
import { tooManyRequests } from "#utils/responses";
import router from "@adonisjs/core/services/router";
const GetSessionController = () => import("./get-session/index.ts");
const LogoutController = () => import("./logout/index.ts");
const LoginController = () => import("./login/index.ts");
const SignupController = () => import("./signup/index.ts");

router
  .group(() => {
    router.post("/signup", [SignupController]).openapi({
      summary: "Create user account",
      description: "Creates a new base user account.",
    });
    router.post("/login", [LoginController]).openapi({
      summary: "Start user session",
      description: "Logs in a user and creates a session in Redis.",
      responses: {
        ...tooManyRequests,
      },
    });
    router.post("/logout", [LogoutController]).openapi({
      summary: "End user session",
      description:
        "Logs out the current user and deletes their session from Redis.",
    });
    router
      .get("/session", [GetSessionController])
      .openapi({
        summary: "Get user session",
        description: "Retrieves the current session's user information.",
      })
      .use(middleware.auth());
  })
  .prefix("auth")
  .openapi({ tags: ["Authentication"] });
