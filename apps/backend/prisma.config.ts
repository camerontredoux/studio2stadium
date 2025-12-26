import { defineConfig, env } from "prisma/config";

import "dotenv/config";

export default defineConfig({
  schema: "app/database/prisma/schema.prisma",
  migrations: {
    path: "app/database/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
