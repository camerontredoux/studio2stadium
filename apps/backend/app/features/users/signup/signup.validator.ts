import vine, { SimpleMessagesProvider } from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const signupValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string().minLength(8),
    confirmPassword: vine.string().confirmed({ as: "password" }),
    username: vine.string(),
    firstName: vine.string(),
    lastName: vine.string(),
    phone: vine.string().optional(),
    termsChecked: vine.literal(true),
  })
);

signupValidator.messagesProvider = new SimpleMessagesProvider({
  "termsChecked.literal": "Please accept the terms of service",
});

export type SignupValidator = Infer<typeof signupValidator>;
