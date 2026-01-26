import { PlatformName } from "#database/generated/types";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const onboardValidator = vine.create(
  vine.object({
    platform: vine.enum(PlatformName),
    birthday: vine.date(),
    phoneNumber: vine.string().mobile().optional(),
    location: vine.string(),
  })
);

export type OnboardValidator = Infer<typeof onboardValidator>;
