import { birthdaySchema } from "@/lib/schemas";
import { z } from "zod";

export const MAX_NAME_LENGTH = 64;

export const schemas = {
  updateProfile: z.object({
    firstName: z.string().min(2).max(MAX_NAME_LENGTH).optional(),
    lastName: z.string().min(2).max(MAX_NAME_LENGTH).optional(),
    displayEmail: z.email().optional(),
    phone: z.string().nullable(),
    avatar: z.string().optional(),
    location: z.string({ error: "Location is required" }).optional(),
    birthday: birthdaySchema,
  }),
} as const;
