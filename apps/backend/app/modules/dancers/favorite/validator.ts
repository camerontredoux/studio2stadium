import { platformName } from "#database/schema/enums";
import vine from "@vinejs/vine";
import { Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string(),
    }),
    platformName: vine.enum(platformName.enumValues),
  })
);

export type Validator = Infer<typeof schema>;
