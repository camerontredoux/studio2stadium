import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(128),
    slug: vine.string().trim().minLength(1).maxLength(64).regex(/^[a-z0-9-]+$/),
    logoUrl: vine.string().optional(),
    primaryColor: vine.string().maxLength(16).optional(),
    accentColor: vine.string().maxLength(16).optional(),
    features: vine.object({}).allowUnknownProperties().optional(),
    settings: vine.object({}).allowUnknownProperties().optional(),
  })
);

export type Validator = Infer<typeof schema>;
