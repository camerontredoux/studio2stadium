import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";
const DeleteDancerController = () => import("./delete_dancer/delete_dancer.controller.js");
const UpdateDancerController = () => import("./update_dancer/update_dancer.controller.js");
const GetDancersController = () => import("./get_dancers/get_dancers.controller.js");
const GetDancerByIdController = () => import("./get_dancer_by_id/get_dancer_by_id.controller.js");
const CreateDancerController = () => import("./create_dancer/create_dancer.controller.js");

router
  .group(() => {
    router.post("/", [CreateDancerController]).openapi({ description: "Create a dancer" });
    router.get("/", [GetDancersController]).openapi({ description: "Get all dancers" });
    router.get("/:id", [GetDancerByIdController]).openapi({ description: "Get a dancer by id" });
    router
      .patch("/:id", [UpdateDancerController])
      .openapi({ description: "Update a specific dancer" });
    router
      .delete("/:id", [DeleteDancerController])
      .openapi({ description: "Delete a specific dancer" });
  })
  .prefix("/dancers")
  .use(middleware.auth())
  .openapi({ tags: ["dancers"] });
