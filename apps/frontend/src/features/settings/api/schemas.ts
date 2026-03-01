import { passwordSchema } from "@/lib/schemas";
import { z } from "zod";

export const MAX_NAME_LENGTH = 64;

export const accountSchemas = {
  updateAccount: z.object({
    firstName: z.string().min(2).max(MAX_NAME_LENGTH).optional(),
    lastName: z.string().min(2).max(MAX_NAME_LENGTH).optional(),
    displayEmail: z.email().optional(),
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
    idType: z.string(),
    mediaId: z.string(),
    location: z.string(),
  }),
} as const;
