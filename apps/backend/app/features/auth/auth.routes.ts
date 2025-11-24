import router from "@adonisjs/core/services/router";
const LogoutController = () => import("./logout/logout.controller.js");
const LoginController = () => import("./login/login.controller.js");
const RegisterController = () => import("./register/register.controller.js");

router
  .group(() => {
    router.post("/register", [RegisterController]);
    router.post("/login", [LoginController]);
    router.post("/logout", [LogoutController]);
  })
  .prefix("auth")
  .openapi({ tags: ["auth"] });
