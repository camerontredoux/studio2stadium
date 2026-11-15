import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";
import { SWITCHABLE_PLANS } from "./switchable.ts";

export const schema = vine.create(
  vine.object({
    plan: vine.enum(SWITCHABLE_PLANS),
    // From the preview the member confirmed, so the charge matches it.
    prorationDate: vine.number().withoutDecimals().positive(),
  })
);

export type Validator = Infer<typeof schema>;
