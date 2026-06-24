import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    paid: vine.boolean(),
  })
);
export type Validator = Infer<typeof schema>;
