import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";
const LogoutController = () => import("./logout/logout.controller.js");
const LoginController = () => import("./login/login.controller.js");
const SignupController = () => import("./signup/signup.controller.js");

router
  .group(() => {
    router.post("/signup", [SignupController]).openapi({
      summary: "Create user account",
    });
    router.post("/login", [LoginController]).openapi({ summary: "Create user session" });
    router.post("/logout", [LogoutController]).openapi({
      summary: "Sign out",
      responses: {
        "400": {
          $ref: "#/components/responses/BadRequest",
        },
      },
    });
    router
      .get("/me", async ({ auth, response }) => {
        const user = auth.getUserOrFail();
        return response.ok(user);
      })
      .use(middleware.auth())
      .openapi({ summary: "Get authenticated user" });
    router.post("/:id", [LoginController]);
  })
  .prefix("auth")
  .openapi({ tags: ["Authentication"] });
