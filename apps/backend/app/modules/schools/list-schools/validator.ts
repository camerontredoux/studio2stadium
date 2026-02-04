import vine from "@vinejs/vine";
import { Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    cursor: vine.string().optional(),
  })
);

export type Validator = Infer<typeof validator>;
