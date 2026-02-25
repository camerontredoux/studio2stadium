import { birthdaySchema } from "@/lib/schemas";
import { z } from "zod";

export const MAX_NAME_LENGTH = 64;

export const schemas = {
  updateProfile: z.object({
    firstName: z.string().min(2).max(MAX_NAME_LENGTH).optional(),
    lastName: z.string().min(2).max(MAX_NAME_LENGTH).optional(),
    displayEmail: z.email().optional(),
    phone: z.string().nullable(),
    location: z.string({ error: "Location is required" }).optional(),
  }),
  updatePortfolio: z.object({
    biography: z.string().optional(),
    gpa: z.string().optional(),
    gradYear: z.string().optional(),
    trainingHours: z.string().optional(),
    highSchool: z.string().optional(),
    studio: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    skillLevel: z.string().optional(),
    teamLevel: z.string().optional(),
    location: z.string({ error: "Location is required" }).optional(),
    birthday: birthdaySchema,
  }),
} as const;
