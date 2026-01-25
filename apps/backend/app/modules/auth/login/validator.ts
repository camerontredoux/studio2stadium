import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const loginValidator = vine.create(
  vine.object({
    email: vine.string().email().normalizeEmail().trim(),
    password: vine.string().minLength(8),
  })
);

export type LoginValidator = Infer<typeof loginValidator>;
