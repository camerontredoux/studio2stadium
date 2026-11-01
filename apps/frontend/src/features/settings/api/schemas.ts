import { passwordSchema } from "@/lib/schemas";
import { z } from "zod";

export const MAX_NAME_LENGTH = 64;
export const MAX_USERNAME_LENGTH = 32;

export const accountSchemas = {
  updateAccount: z.object({
    username: z
      .string()
      .min(4, "Username must be at least 4 characters long")
      .max(
        MAX_USERNAME_LENGTH,
        `Username must be at most ${MAX_USERNAME_LENGTH} characters long`,
      )
      .regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric"),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters long")
      .max(
        MAX_NAME_LENGTH,
        `First name must be at most ${MAX_NAME_LENGTH} characters long`,
      )
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters long")
      .max(
        MAX_NAME_LENGTH,
        `Last name must be at most ${MAX_NAME_LENGTH} characters long`,
      )
      .optional(),
    displayEmail: z.email("Enter a valid email address").optional(),
    phone: z.string().nullable(),
    notifications: z.boolean().optional(),
  }),
  updatePassword: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: passwordSchema,
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }),
  submitApplication: z.object({
    phone: z.string(),
    mediaId: z.string(),
  }),
  feedback: z.object({
    type: z.enum(["bug", "feature", "improvement", "other"]),
    message: z.string().min(10, "Please provide more details"),
  }),
} as const;
