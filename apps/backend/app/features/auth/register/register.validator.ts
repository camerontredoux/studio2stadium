import vine from "@vinejs/vine";
import { InferInput } from "@vinejs/vine/types";

export const registerSchema = vine.object({
  email: vine.string().email().trim(),
  password: vine.string().minLength(8),
  username: vine.string(),
  firstName: vine.string(),
  lastName: vine.string(),
});

export const RegisterValidator = vine.compile(registerSchema);
export type RegisterValidator = InferInput<typeof registerSchema>;
