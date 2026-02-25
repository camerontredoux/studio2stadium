import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    gpa: vine.number().optional(),
    birthday: vine.string().optional(),
    gradYear: vine.number().optional(),
    location: vine.string().optional(),
    trainingHours: vine.number().optional(),
    highSchool: vine.string().optional(),
    studio: vine.string().optional(),
    skillLevel: vine.string().optional(),
    teamLevel: vine.string().optional(),
    instagram: vine.string().optional(),
    tiktok: vine.string().optional(),
    youtube: vine.string().optional(),
    biography: vine.string().optional(),
  })
);

export type Validator = Infer<typeof validator>;
