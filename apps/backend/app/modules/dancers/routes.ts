import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const GetDancerController = () => import("./get-dancer/controller.ts");
const GetFiltersController = () => import("./get-filters/controller.ts");
const CreateDancerController = () => import("./create-dancer/controller.ts");
const GetProfileController = () => import("./me/get-profile/controller.ts");
const GetPortfolioController = () => import("./me/get-portfolio/controller.ts");
const UpdateProfileController = () =>
  import("./me/update-profile/controller.ts");
const UpdatePortfolioController = () =>
  import("./me/update-portfolio/controller.ts");

router
  .group(() => {
    router
      .post("/", [CreateDancerController])
      .openapi({
        summary: "Create a dancer",
        description:
          "Populate account with personal information to finish dancer signup",
      })
      .use(middleware.auth());

    router.get("/filters", [GetFiltersController]).openapi({
      summary: "Get dancer filters",
      description: "Returns the filters to use when searching for dancers",
    });

    // Me
    router
      .group(() => {
        router.get("profile", [GetProfileController]).openapi({
          summary: "Get my dancer profile",
          description: "Returns the authenticated dancer's profile settings",
        });
        router.patch("profile", [UpdateProfileController]).openapi({
          summary: "Update my dancer profile",
          description: "Updates the authenticated dancer's profile settings",
        });
        router.get("portfolio", [GetPortfolioController]).openapi({
          summary: "Get my portfolio",
          description: "Returns the authenticated dancer's portfolio",
        });
        router.patch("portfolio", [UpdatePortfolioController]).openapi({
          summary: "Update my portfolio",
          description: "Updates the authenticated dancer's portfolio",
        });
      })
      .prefix("me")
      .use([middleware.auth(), middleware.dancer()]);

    router
      .get("/:username", [GetDancerController])
      .openapi({
        summary: "Get a dancer",
        description: "Returns the dancer's public profile",
      })
      .use(middleware.auth());
  })
  .prefix("dancers")
  .openapi({ tags: ["Dancers"] });
