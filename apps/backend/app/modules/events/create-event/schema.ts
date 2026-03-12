import { danceEventType } from "#database/schema/enums";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const createEventSchema = vine.create(
  vine.object({
    title: vine.string(),
    description: vine.string(),
    location: vine.string(),
    address: vine.string().optional(),
    website: vine.string().optional(),
    tags: vine.array(vine.string()).optional(),
    type: vine.enum(danceEventType.enumValues),
    startDatetime: vine.string(),
    endDatetime: vine.string(),
  })
);

export type CreateEventSchema = Infer<typeof createEventSchema>;
