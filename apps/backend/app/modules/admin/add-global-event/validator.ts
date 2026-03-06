import { danceEventType } from "#database/schema/enums";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    title: vine.string(),
    thumbnail: vine.string(),
    description: vine.string(),
    location: vine.string(),
    website: vine.string(),
    organization: vine.string(),
    startDatetime: vine.string(),
    endDatetime: vine.string(),
    type: vine.enum(danceEventType.enumValues),
  })
);

export type Validator = Infer<typeof schema>;
