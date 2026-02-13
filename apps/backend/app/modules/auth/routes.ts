import { middleware } from "#start/kernel";
import { tooManyRequests } from "#utils/responses";
import router from "@adonisjs/core/services/router";

const ChangePasswordController = () =>
  import("./change-password/controller.ts");
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

    router
      .group(() => {
        router
          .post("change", [ChangePasswordController])
          .openapi({
            summary: "Change password",
            description: "Changes the user's password",
          })
          .use(middleware.auth());

        router.post("reset", [ChangePasswordController]).openapi({
          summary: "Reset password",
          description: "Resets the user's password",
        });
      })
      .prefix("password");
  })
  .prefix("auth")
  .openapi({ tags: ["Authentication"] });
