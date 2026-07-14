import { z } from "zod";

export const dancerSearchSchema = z.object({
  search: z.string().default(""),
  interested: z.boolean().default(false),
});

export const dancerEventSearchSchema = z.object({
  eventId: z.string().uuid().optional(),
});

export type DancerSearchForm = z.infer<typeof dancerSearchSchema>;

export const noteSchema = z.object({
  content: z.string().max(2000),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const schoolSelectionSchema = z.object({
  coachRosterId: z.string().uuid(),
});
