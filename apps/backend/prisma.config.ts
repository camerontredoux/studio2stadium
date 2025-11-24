import { defineConfig, env } from "prisma/config";

import "dotenv/config";

export default defineConfig({
  schema: "database/prisma/schema.prisma",
  migrations: {
    path: "database/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
