import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    type: vine.enum(["dancer", "coach"] as const),
  }),
);
export type Validator = Infer<typeof schema>;
