import { z } from "zod";

export const forgotSchemas = {
  forgot: z.object({
    email: z.email(),
  }),
};
