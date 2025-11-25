import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";
const LogoutController = () => import("./logout/logout.controller.js");
const LoginController = () => import("./login/login.controller.js");
const RegisterController = () => import("./register/register.controller.js");

router
  .group(() => {
    router.post("/register", [RegisterController]);
    router.post("/login", [LoginController]);
    router.post("/logout", [LogoutController]);
    router
      .get("/me", async ({ auth, response }) => {
        const user = auth.getUserOrFail();
        return response.ok(user);
      })
      .use(middleware.auth());
  })
  .prefix("auth")
  .openapi({ tags: ["authentication"] });
