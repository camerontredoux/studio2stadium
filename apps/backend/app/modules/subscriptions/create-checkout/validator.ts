import { PAID_PLANS } from "#shared/plans";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    plan: vine.enum(PAID_PLANS).optional().requiredIfMissing("type"),
    // The two-price checkout sent `type`; kept so a cached older app can
    // still check out. "yearly" is the Annual plan.
    type: vine.enum(["monthly", "yearly"]).optional(),
  })
);

export type Validator = Infer<typeof schema>;
