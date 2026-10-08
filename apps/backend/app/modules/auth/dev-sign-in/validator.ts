import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    code: vine.string().regex(/^[0-9a-f]{64}$/),
  })
);

export type Validator = Infer<typeof validator>;
