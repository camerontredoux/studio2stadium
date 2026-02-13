import type { AccountType } from "@/lib/access";
import { passwordSchema } from "@/lib/schemas";
import { z } from "zod";

export const MAX_NAME_LENGTH = 64;
export const MAX_USERNAME_LENGTH = 32;

export const accountTypeSchema = z.enum([
  "dancer",
  "school",
] satisfies AccountType[]);

export const schemas = {
  type: accountTypeSchema,

  search: z.object({
    redirect: z.string().optional(),
    reason: z.string().optional(),
    username: z.string(),
  }),

  signup: z.object({
    email: z.email(),
    type: accountTypeSchema,
    firstName: z.string().min(2).max(MAX_NAME_LENGTH),
    lastName: z.string().min(2).max(MAX_NAME_LENGTH),
    username: z.string().min(4).max(MAX_USERNAME_LENGTH),
    phone: z.string().optional(),
    password: passwordSchema,
    termsChecked: z.boolean(),
  }),
} as const;
