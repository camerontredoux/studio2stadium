import { z } from "zod";

export const schemas = {
  search: z.object({
    redirect: z.string().optional(),
    reason: z.string().optional(),
  }),

  signup: z.object({
    email: z.email(),
    accountType: z.enum(["dancer", "school"]),
    firstName: z.string().min(2).max(64),
    lastName: z.string().min(2).max(64),
    username: z.string().min(4).max(32),
    phone: z.string().optional(),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(8, "Minimum 8 characters"),
    termsChecked: z.boolean(),
  }),
};
