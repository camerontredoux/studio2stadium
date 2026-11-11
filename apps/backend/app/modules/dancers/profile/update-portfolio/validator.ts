import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    gpa: vine.number().nullable().optional(),
    birthday: vine.string().optional(),
    gradYear: vine.number().nullable().optional(),
    location: vine.string().optional(),
    trainingHours: vine.number().nullable().optional(),
    highSchool: vine.string().nullable().optional(),
    studio: vine.string().nullable().optional(),
    teamLevel: vine.string().nullable().optional(),
    instagram: vine.string().nullable().optional(),
    tiktok: vine.string().nullable().optional(),
    youtube: vine.string().nullable().optional(),
    biography: vine.string().nullable().optional(),
    // Sent with biography by the formatting editor. Omitted by older clients,
    // which leaves the stored format as it was.
    biographyFormat: vine.enum(["plain", "rich"] as const).optional(),
  })
);

export type Validator = Infer<typeof validator>;
