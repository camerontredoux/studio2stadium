import { SWITCHABLE_PLANS } from "#modules/subscriptions/change-plan/switchable";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    plan: vine.enum(SWITCHABLE_PLANS),
  })
);

export type Validator = Infer<typeof schema>;
