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

export const unprocessableEntity = {
  "422": {
    description: "Unprocessable Entity",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Error",
        },
      },
    },
  },
};
