import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    name: vine.string().trim().minLength(1).maxLength(128).optional(),
    slug: vine.string().trim().minLength(1).maxLength(64).regex(/^[a-z0-9-]+$/).optional(),
    logoUrl: vine.string().nullable().optional(),
    primaryColor: vine.string().maxLength(16).nullable().optional(),
    accentColor: vine.string().maxLength(16).nullable().optional(),
    features: vine.object({}).allowUnknownProperties().optional(),
    settings: vine.object({}).allowUnknownProperties().optional(),
  })
);

export type Validator = Infer<typeof schema>;
