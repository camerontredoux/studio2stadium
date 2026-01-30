import type { AccountType } from "@/lib/access";
import { z } from "zod";

export const MAX_NAME_LENGTH = 64;
export const MAX_USERNAME_LENGTH = 32;
export const MAX_PASSWORD_LENGTH = 64;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(MAX_PASSWORD_LENGTH)
  .refine(
    (password) => /[A-Z]/.test(password),
    "Password must contain at least one uppercase letter",
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "Password must contain at least one lowercase letter",
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "Password must contain at least one number",
  )
  .refine(
    (password) => /[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(password),
    "Password must contain at least one special character",
  );

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
