import vine, { SimpleMessagesProvider } from "@vinejs/vine";
import { Infer } from "@vinejs/vine/types";

export const SignupValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string().minLength(8),
    username: vine.string(),
    first_name: vine.string(),
    last_name: vine.string(),
    phone: vine.string().optional(),
    terms_checked: vine.literal(true),
  })
);

SignupValidator.messagesProvider = new SimpleMessagesProvider({
  "terms_checked.literal": "Please accept the terms of service",
});

export type SignupValidator = Infer<typeof SignupValidator>;
