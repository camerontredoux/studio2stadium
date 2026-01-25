import { z } from "zod";

export const schemas = {
  search: z.object({
    redirect: z.string().optional(),
    reason: z.string().optional(),
  }),

  login: z.object({
    email: z.email(),
    password: z.string().min(2, "Minimum 8 characters"),
  }),
};
