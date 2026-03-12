import { danceEventType } from "#database/schema/enums";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    title: vine.string().optional(),
    thumbnail: vine.string().optional(),
    description: vine.string().optional(),
    location: vine.string().optional(),
    website: vine.string().optional(),
    organization: vine.string().optional(),
    startDatetime: vine.string().optional(),
    endDatetime: vine.string().optional(),
    type: vine.enum(danceEventType.enumValues).optional(),
  })
);

export type Validator = Infer<typeof schema>;
