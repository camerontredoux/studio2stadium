import { danceEventType } from "#database/schema/enums";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const editEventSchema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    title: vine.string().optional(),
    description: vine.string().optional(),
    location: vine.string().optional(),
    address: vine.string().optional(),
    website: vine.string().optional(),
    tags: vine.array(vine.string()).optional(),
    cost: vine.string().optional(),
    type: vine.enum(danceEventType.enumValues).optional(),
    startDatetime: vine.string().optional(),
    endDatetime: vine.string().optional(),
    timezone: vine.string().optional(),
  })
);

export type EditEventSchema = Infer<typeof editEventSchema>;
