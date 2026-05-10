import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    rating: vine.number().withoutDecimals().min(1).max(5),
  })
);

export type Validator = Infer<typeof schema>;
