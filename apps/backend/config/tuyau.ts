import { defineConfig } from "@tuyau/core";

const tuyauConfig = defineConfig({
  openapi: {
    documentation: {
      info: {
        title: "Studio 2 Stadium",
        version: "1.0.0",
        description: "OpenAPI specification for the Studio 2 Stadium JSON API",
        summary: "This is a summary",
      },
      tags: [
        { name: "subscriptions", description: "Operations about subscriptions" },
        { name: "Authentication", description: "Operations about authentication" },
      ],
    },
  },
});

export default tuyauConfig;
