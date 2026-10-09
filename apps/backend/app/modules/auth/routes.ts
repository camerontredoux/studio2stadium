import env from "#start/env";
import { middleware } from "#start/kernel";
import { tooManyRequests } from "#utils/responses";
import app from "@adonisjs/core/services/app";
import router from "@adonisjs/core/services/router";
import { isDevSignInEnabled } from "./dev-sign-in/enabled.ts";
const ResetPasswordController = () => import("./reset-password/controller.ts");
const ForgotPasswordController = () =>
  import("./forgot-password/controller.ts");
const ChangePasswordController = () =>
  import("./change-password/controller.ts");
const GetSessionController = () => import("./get-session/controller.ts");
const LogoutController = () => import("./logout/controller.ts");
const LoginController = () => import("./login/controller.ts");
const SignupController = () => import("./signup/controller.ts");
const DevSignInController = () => import("./dev-sign-in/controller.ts");

router
  .group(() => {
    router.post("signup", [SignupController]).openapi({
      summary: "Create user account",
      description: "Creates a new base user account.",
    });
    router.post("login", [LoginController]).openapi({
      summary: "Start user session",
      description: "Logs in a user and creates a session in Redis.",
      responses: {
        ...tooManyRequests,
      },
    });
    router.post("logout", [LogoutController]).openapi({
      summary: "End user session",
      description:
        "Logs out the current user and deletes their session from Redis.",
    });
    router
      .get("session", [GetSessionController])
      .openapi({
        summary: "Get user session",
        description: "Retrieves the current session's user information.",
      })
      .use(middleware.auth());

    // Dev only: absent unless the local HTTP server runs with
    // NODE_ENV=development and DEV_SIGN_IN_LINK_ENABLED=true.
    if (
      isDevSignInEnabled({
        nodeEnvironment: app.nodeEnvironment,
        appEnvironment: app.getEnvironment(),
        flag: env.get("DEV_SIGN_IN_LINK_ENABLED"),
      })
    ) {
      router.get("dev-sign-in", [DevSignInController]).openapi({
        summary: "Dev sign-in link",
        description:
          "Development only. Consumes a one-time code minted by run-dev-server's sign-in.sh, starts a session for its user and redirects to SITE_URL.",
      });
    }

    router
      .group(() => {
        router
          .post("change", [ChangePasswordController])
          .openapi({
            summary: "Change password",
            description: "Changes the user's password",
          })
          .use(middleware.auth());

        router.post("forgot", [ForgotPasswordController]).openapi({
          summary: "Forgot password",
          description: "Sends a password reset email to the user",
        });

        router.post("reset", [ResetPasswordController]).openapi({
          summary: "Reset password",
          description: "Resets the user's password",
        });
      })
      .prefix("password");
  })
  .prefix("auth")
  .openapi({ tags: ["Authentication"] });
