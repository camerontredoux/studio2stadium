import vine, { SimpleMessagesProvider } from "@vinejs/vine";
import { InferInput } from "@vinejs/vine/types";

export const registerSchema = vine.object({
  email: vine.string().email().trim(),
  password: vine.string().minLength(8),
  username: vine.string(),
  first_name: vine.string(),
  last_name: vine.string(),
  phone: vine.string().optional(),
  terms_checked: vine.literal(true),
});

export const RegisterValidator = vine.compile(registerSchema);

RegisterValidator.messagesProvider = new SimpleMessagesProvider({
  "terms_checked.literal": "Please accept the terms of service",
});

export type RegisterValidator = InferInput<typeof registerSchema>;
