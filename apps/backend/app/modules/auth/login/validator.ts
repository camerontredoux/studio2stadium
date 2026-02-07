import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    email: vine.string().email().normalizeEmail().trim(),
    password: vine.string().minLength(8),
  })
);

export type Validator = Infer<typeof validator>;
