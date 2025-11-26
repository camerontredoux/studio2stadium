import { defineConfig } from "@tuyau/core";

const tuyauConfig = defineConfig({
  openapi: {
    documentation: {
      components: {
        responses: {
          BadRequest: {
            description: "Bad Request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BadRequestError" },
              },
            },
          },
        },
        schemas: {
          BadRequestError: {
            "x-scalar-ignore": true,
            "description": "RFC 7807 (https://datatracker.ietf.org/doc/html/rfc7807)",
            "type": "object",
            "properties": {
              type: {
                type: "string",
                examples: ["https://example.com/errors/bad-request"],
              },
              title: { type: "string", examples: ["Bad Request"] },
              status: { type: "integer", format: "int64", examples: [400] },
              detail: {
                type: "string",
                examples: ["The request was invalid."],
              },
            },
          },
        },
      },
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
