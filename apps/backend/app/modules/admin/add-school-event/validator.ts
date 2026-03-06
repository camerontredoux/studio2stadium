import { danceEventType } from "#database/schema/enums";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      schoolId: vine.string().uuid(),
    }),
    title: vine.string(),
    description: vine.string(),
    location: vine.string(),
    address: vine.string().optional(),
    website: vine.string().optional(),
    tags: vine.array(vine.string()).optional(),
    cost: vine.string().optional(),
    type: vine.enum(danceEventType.enumValues),
    startDatetime: vine.string(),
    endDatetime: vine.string(),
    timezone: vine.string(),
  })
);

export type Validator = Infer<typeof schema>;
