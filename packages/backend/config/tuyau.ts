import { defineConfig } from "@tuyau/core";

const tuyauConfig = defineConfig({
  openapi: {
    documentation: {
      info: {
        title: "Studio 2 Stadium API",
        version: "1.0.0",
        description:
          "Endpoint documentation for the backend. TanStack Query hooks are generated using the openapi specification at `/openapi`",
      },
      tags: [
        {
          name: "Authentication",
          description: "Authentication and user creation endpoints",
        },
      ],
    },
  },
});

export default tuyauConfig;
