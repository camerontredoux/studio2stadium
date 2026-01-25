export const tooManyRequests = {
  "429": {
    description: "Too Many Requests",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error",
        },
      },
    },
  },
};
