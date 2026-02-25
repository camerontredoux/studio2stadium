import { platformName } from "#database/schema/enums";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    platform: vine.enum(platformName.enumValues),
    birthday: vine.date(),
    phoneNumber: vine.string().mobile().optional(),
    location: vine.string(),
  })
);

export type Validator = Infer<typeof validator>;
