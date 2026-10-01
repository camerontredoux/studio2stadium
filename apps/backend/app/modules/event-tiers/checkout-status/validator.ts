import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      // A Checkout Session id, as Stripe substitutes it into the return URL.
      sessionId: vine
        .string()
        .regex(/^cs_[A-Za-z0-9_]+$/)
        .maxLength(255),
    }),
  })
);

export type Validator = Infer<typeof schema>;
