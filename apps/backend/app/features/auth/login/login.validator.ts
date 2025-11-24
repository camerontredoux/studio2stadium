import vine from "@vinejs/vine";
import { InferInput } from "@vinejs/vine/types";

export const loginSchema = vine.object({
  email: vine.string().email().normalizeEmail(),
  password: vine.string().minLength(8),
});

export const LoginValidator = vine.compile(loginSchema);
export type LoginValidator = InferInput<typeof loginSchema>;
