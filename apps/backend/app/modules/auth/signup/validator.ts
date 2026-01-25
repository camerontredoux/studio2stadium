import { AccountType } from "#database/generated/types";
import vine, { SimpleMessagesProvider } from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

const reservedUsernames = new Set([
  "admin",
  "superadmin",
  "root",
  "system",
  "guest",
  "api",
  "bot",
  "robot",
  "system",
  "user",
  "dashboard",
  "events",
  "prodigy",
  "settings",
  "explore",
  "login",
  "signup",
  "home",
  "profile",
  "reset",
  "resources",
  "library",
  "session",
  "unauthorized",
  "school",
  "dancer",
  "onboarding",
  "subscription",
  "notifications",
]);

export const signupValidator = vine.create(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().minLength(8),
    accountType: vine.enum(AccountType),
    username: vine
      .string()
      .trim()
      .minLength(4)
      .maxLength(32)
      .notIn(Array.from(reservedUsernames)),
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
