/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { db } from "#services/database";
import router from "@adonisjs/core/services/router";

router.get("/", async () => {
  const users = await db.selectFrom("users").select("id").execute();

  return {
    users,
  };
});
