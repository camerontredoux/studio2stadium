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
    gpa: z.coerce.number().optional(),
    gradYear: z.coerce.number().optional(),
    location: z
      .string({ error: "Location is required" })
      .optional()
      .transform((v) => v || null),
    birthday: birthdaySchema,
  }),
  updateContact: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
  }),
  updateExtra: z.object({
    trainingHours: z.coerce.number().optional(),
    highSchool: z.string().optional(),
    studio: z.string().optional(),
    teamLevel: z.string().optional(),
  }),
  createAchievement: z.object({
    title: z.string().min(1, "Title is required").max(128),
    description: z.string().min(1, "Description is required").max(512),
  }),
  createReference: z.object({
    name: z.string().min(1, "Name is required").max(128),
    title: z.string().min(1, "Title is required").max(128),
    description: z.string().min(1, "Description is required").max(512),
  }),
} as const;
