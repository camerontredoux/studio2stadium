import { accountType } from "#database/schema/enums";
import vine, { SimpleMessagesProvider } from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const blacklist = [
  // Roles & access levels
  "admin",
  "administrator",
  "superadmin",
  "mod",
  "moderator",
  "staff",
  "team",
  "official",
  "root",
  "system",
  "guest",
  "user",
  "bot",
  "robot",

  // Auth & account
  "auth",
  "login",
  "logout",
  "signup",
  "register",
  "reset",
  "verify",
  "callback",
  "onboarding",
  "session",
  "account",
  "password",
  "unsubscribe",

  // Your app routes
  "home",
  "dashboard",
  "profile",
  "settings",
  "explore",
  "search",
  "feed",
  "events",
  "notifications",
  "messages",
  "library",
  "resources",
  "subscription",
  "checkout",
  "pricing",
  "invite",
  "school",
  "dancer",
  "prodigy",
  "core",

  // Static/legal pages
  "about",
  "help",
  "support",
  "terms",
  "privacy",
  "contact",
  "blog",
  "news",
  "faq",

  // Technical paths
  "api",
  "webhooks",
  "static",
  "assets",
  "public",
  "uploads",
  "images",
  "favicon.ico",
  "robots.txt",
  "sitemap",
  ".well-known",

  // Impersonation risks
  "unauthorized",
];

export const validator = vine.create(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().minLength(8),
    type: vine.enum(accountType.enumValues),
    username: vine
      .string()
      .alphaNumeric()
      .trim()
      .minLength(4)
      .maxLength(32)
      .notIn(Array.from(blacklist)),
    firstName: vine.string().trim().minLength(2).maxLength(64),
    lastName: vine.string().trim().minLength(2).maxLength(64),
    phone: vine.string().mobile().optional(),
    termsChecked: vine.literal(true),
    name: vine.string().minLength(2).maxLength(100).trim().optional(),
    location: vine.string().optional(),
  })
);

validator.messagesProvider = new SimpleMessagesProvider({
  "termsChecked.literal": "Please accept the terms of service",
});

export type Validator = Infer<typeof validator>;
