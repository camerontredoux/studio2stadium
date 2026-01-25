import { defineConfig } from "@tuyau/core";

const openapiConfig = defineConfig({
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
      components: {
        schemas: {
          Error: {
            properties: {
              message: {
                type: "string",
                description:
                  "Human-readable error message suitable for display",
              },
              code: {
                type: "string",
                description:
                  "Machine-readable error code for programmatic handling",
                example: "E_BAD_REQUEST",
              },
              status: {
                type: "integer",
                description: "HTTP status code returned by the server",
                example: 429,
              },
              retryAfter: {
                type: "integer",
                description: "Seconds until the request can be retried",
                example: 60,
              },
              errors: {
                type: "array",
                description: "Additional context specific to the error type",
                items: {
                  $ref: "#/components/schemas/ValidationError",
                },
              },
            },
            required: ["message", "code", "status"],
          },
          ValidationError: {
            properties: {
              field: {
                type: "string",
                description: "Validation error field name",
                example: "email",
              },
              message: {
                type: "string",
                description: "Validation error message",
                example: "Email is required",
              },
            },
            required: ["field", "message"],
          },
        },
      },
    },
  },
});

export default openapiConfig;
