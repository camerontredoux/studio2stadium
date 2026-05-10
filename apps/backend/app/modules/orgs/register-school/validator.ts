import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    token: vine.string().trim().minLength(8).maxLength(128),
    firstName: vine.string().trim().minLength(1).maxLength(64),
    lastName: vine.string().trim().minLength(1).maxLength(64),
    password: vine.string().minLength(8).maxLength(128),
    name: vine.string().trim().minLength(1).maxLength(128),
    location: vine.string().trim().minLength(1).maxLength(256),
    city: vine.string().trim().minLength(1).maxLength(128).optional(),
  })
);

export type Validator = Infer<typeof schema>;
