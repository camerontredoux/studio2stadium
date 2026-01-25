import type { AccountType } from "@/lib/access";
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Minimum 8 characters")
  .max(64, "Maximum 64 characters")
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

export const schemas = {
  search: z.object({
    redirect: z.string().optional(),
    reason: z.string().optional(),
  }),

  signup: z
    .object({
      email: z.email(),
      accountType: z.enum(["dancer", "school"] satisfies AccountType[]),
      firstName: z
        .string()
        .min(2, "Minimum 2 characters")
        .max(64, "Maximum 64 characters"),
      lastName: z
        .string()
        .min(2, "Minimum 2 characters")
        .max(64, "Maximum 64 characters"),
      username: z
        .string()
        .min(4, "Minimum 4 characters")
        .max(32, "Maximum 32 characters"),
      phone: z.string().optional(),
      password: passwordSchema,
      confirmPassword: z.string().min(8, "Minimum 8 characters"),
      termsChecked: z.boolean(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      error: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};
