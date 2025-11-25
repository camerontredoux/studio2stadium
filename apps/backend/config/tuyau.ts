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
          name: "authentication",
          description: "Authentication endpoints",
        },
      ],
    },
    scalar: {
      spec: {
        url: "/docs/openapi",
      },
    },
    endpoints: {
      spec: "/docs/openapi",
    },
  },
});

export default tuyauConfig;
