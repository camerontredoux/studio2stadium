import { AccountType } from "#database/generated/types";
import vine, { SimpleMessagesProvider } from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const signupValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().minLength(8),
    accountType: vine.enum(AccountType),
    confirmPassword: vine.string().confirmed({ as: "password" }),
    username: vine.string().trim().minLength(4).maxLength(32),
    firstName: vine.string().trim().minLength(2).maxLength(64),
    lastName: vine.string().trim().minLength(2).maxLength(64),
    phone: vine.string().mobile().optional(),
    termsChecked: vine.literal(true),
  })
);

signupValidator.messagesProvider = new SimpleMessagesProvider({
  "termsChecked.literal": "Please accept the terms of service",
});

export type SignupValidator = Infer<typeof signupValidator>;
