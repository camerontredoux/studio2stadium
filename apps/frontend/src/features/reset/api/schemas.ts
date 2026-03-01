import { passwordSchema } from "@/lib/schemas";
import { z } from "zod";

export const resetSchemas = {
  resetSearch: z.object({
    token: z.string(),
    userId: z.string(),
  }),
  reset: z.object({
    password: passwordSchema,
    token: z.string(),
    userId: z.string(),
  }),
};
